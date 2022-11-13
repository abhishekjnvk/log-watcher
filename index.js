require("dotenv").config();
const { createHash, appLogger, loadLogFiles } = require("./modules/utils");
const express = require("express");
const fileReader = require("./modules/filereader");
const singleread = require("./modules/singleread");
const app = express();
const server = require("http").createServer(app);
const sio = require("socket.io")(server);
const PORT = 3000;
const socketUsers = [];
const logFiles = {};
loadLogFiles(logFiles);

server.listen(PORT, () => {
  appLogger.info("Access the app at http://localhost:" + PORT);
});

sio.on("connection", (socket) => {
  appLogger.info("Connection established with socket id:" + socket.id);
  sio.to(`${socket.id}`).emit("connectionEstablished", {
    files: Object.values(logFiles),
    passwordRequired: process.env.APP_PASSWORD ? true : false,
  });

  socket.on("disconnect", function () {
    appLogger.info("user disconnected of id " + socket.id);

    if (socketUsers[socket.id]) {
      logFiles[createHash(socketUsers[socket.id]["filePath"])].count--;
      //remove the socket id from the list of ids for the file being watched
      const index = logFiles[
        createHash(socketUsers[socket.id]["filePath"])
      ].ids.indexOf(socket.id);

      if (index > -1) {
        logFiles[createHash(socketUsers[socket.id]["filePath"])].ids.splice(
          index,
          1
        );
      }

      if (logFiles[createHash(socketUsers[socket.id]["filePath"])].count == 0) {
        logFiles[
          createHash(socketUsers[socket.id]["filePath"])
        ].watcher.close();
        delete logFiles[createHash(socketUsers[socket.id]["filePath"])].watcher;
        delete logFiles[createHash(socketUsers[socket.id]["filePath"])].ids;
      }
    }
  });

  socket.on("viewlogs", function (data) {
    let password = data.password;
    if (process.env.APP_PASSWORD) {
      if (password != process.env.APP_PASSWORD) {
        sio.to(`${socket.id}`).emit("warningmsg", "Invalid Password");
        return;
      }
    }
    socketUsers[socket.id] = new Array();
    socketUsers[socket.id]["saveFlag"] = 0;
    socketUsers[socket.id]["filePath"] = data.filePath;
    logFiles[createHash(data.filePath)].count++;

    const firstAttemptSize = function (socketUsers, socket) {
      return new Promise((resolve, reject) => {
        var lastfilereadPosition = singleread(sio, socket, socketUsers);
        resolve(lastfilereadPosition, socket);
      });
    };

    const continuesRead = function () {
      if (logFiles[createHash(data.filePath)].count == 1) {
        logFiles[createHash(data.filePath)].ids = [socket.id];
        return new Promise((resolve, reject) => {
          fileReader(sio, socketUsers, socket, logFiles);
        });
      } else {
        appLogger.info("Watcher already running for this file", data.filePath);
        logFiles[createHash(data.filePath)].ids.push(socket.id);
      }
    };

    firstAttemptSize(socketUsers, socket)
      .then((result) => {
        socketUsers[socket.id]["location"] = result;
        return;
      })
      .then(() => {
        continuesRead();
      });
  });
});
