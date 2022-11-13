const path = require("path");
const FolderToWatch = process.env.LOG_FOLDER;
const fs = require("fs");

const appLogFolder = "./logs";
//this is log for log watcher app
if (!fs.existsSync(appLogFolder)) {
  fs.mkdirSync(appLogFolder);
}

const createHash = (str) => {
  const crypto = require("crypto");
  return crypto.createHash("md5").update(str).digest("hex");
};

const loadLogFiles = (logFiles = {}) => {
  //check if the log folder exists or not
  if (!fs.existsSync(FolderToWatch)) {
    appLogger.error("Log folder does not exist");
    return;
  }

  const files = fs.readdirSync(FolderToWatch);
  files.forEach((file) => {
    const filePath = path.join(FolderToWatch, file);
    logFiles[createHash(filePath)] = {
      path: filePath,
      count: 0,
      name: file,
    };
  });
};

const appLogger = {
  info: (msg) => {
    const log = `INFO: ${new Date().getTime()}: ${msg} \n`;
    fs.appendFileSync(path.join(appLogFolder, "info.log"), log);
    if (process.env.CONSOLE_LOG === "true") {
      console.log(log);
    }
  },
  error: (msg) => {
    const log = `Error: ${new Date().getTime()}: ${msg} \n`;
    fs.appendFileSync(path.join(appLogFolder, "error.log"), log);
    if (process.env.CONSOLE_LOG === "true") {
      console.log(log);
    }
  },
};

module.exports = {
  createHash,
  appLogger,
  loadLogFiles,
};
