const fs = require("fs");
const rf = require("readline");
const { appLogger } = require("./utils");

const singleRead = (sio, socket, socketUsers) => {
  const logFilename = socketUsers[socket.id]["filePath"];
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(logFilename)) {
      sio.to(`${socket.id}`).emit("warningmsg", "File Does not exists");

      return reject("File Does not exists");
    }
    fs.stat(logFilename, (err, stat) => {
      let calculateStartSize = 0;

      if (stat.size > 5000) {
        calculateStartSize = stat.size - 5000;
      }

      const rl = rf.createInterface({
        input: fs.createReadStream(logFilename, { start: calculateStartSize }),
        crlfDelay: Infinity,
      });

      if (socketUsers.indexOf(socket.id) == -1) {
        rl.on("line", (line) => {
          let lineData = "";
          if (line.length > 0) {
            sio.to(`${socket.id}`).emit("streamingdata", line);
          }
          lineData = line;
          if (lineData == "") {
            reject("Failed to read the file");
          } else {
            resolve([socketUsers, socket]);
          }
        });
      }
    });
  });
};

const getLastSize = (socketUsers, socket) => {
  const logFilename = socketUsers[socket.id]["filePath"];
  return new Promise((resolve, reject) => {
    fs.stat(logFilename, (err, statser) => {
      let currFileLastSize = statser.size;
      if (currFileLastSize == 0) {
        reject("Failed to read the file");
      } else {
        resolve(currFileLastSize);
      }
    });
  });
};

const initializeSingleRead = function (sio, socket, socketUsers) {
  const lastfilereadPosition = singleRead(sio, socket, socketUsers)
    .then(
      (socketUsers) => {
        return getLastSize(socketUsers[0], socketUsers[1]);
      },
      function (error) {
        appLogger.info("Stage 2", error);
        // throw error;
      }
    )
    .then((result) => {
      appLogger.info("Last file read position :" + result);
      return result;
    })
    .catch((err) => {
      appLogger.error("Error while single read :" + err);
    });

  return lastfilereadPosition;
};

module.exports = initializeSingleRead;
