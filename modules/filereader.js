const fs = require("fs");
const rf = require("readline");
const { createHash, appLogger } = require("./utils");

const reader = (sio, socketUsers, socket, logFiles) => {
  const logFilename = socketUsers[socket.id]["filePath"];
  if (!fs.existsSync(logFilename)) {
    sio.to(`${socket.id}`).emit("warningmsg", "File Does not exists");
    return;
  }
  let watcher = fs.watch(logFilename, function (event) {
    appLogger.info(
      "File " +
        logFilename +
        " changed sending data to " +
        logFiles[createHash(logFilename)].ids.length +
        " clients"
    );

    fs.stat(logFilename, (err, stat) => {
      let oldsize = socketUsers[socket.id]["location"] || 0;
      if (stat.size >= oldsize) {
        //get the file data from start and end position specified.
        const fsread = fs.createReadStream(logFilename, {
          start: oldsize,
          end: stat.size,
        });
        const fileReadLine = rf.createInterface({
          input: fsread,
          crlfDelay: Infinity,
        });
        fileReadLine.on("line", (line) => {
          for (
            let i = 0;
            i < logFiles[createHash(logFilename)].ids.length;
            i++
          ) {
            sio
              .to(`${logFiles[createHash(logFilename)].ids[i]}`)
              .emit("streamingdata", line);
          }
        });
        oldsize = stat.size;
        socketUsers[socket.id]["location"] = oldsize;
      } else {
        appLogger.info("File size is same");
      }
    });
  });
  logFiles[createHash(logFilename)].watcher = watcher;
};

module.exports = reader;
