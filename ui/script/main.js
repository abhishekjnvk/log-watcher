var hostname = $(location).attr("hostname");
var cio = io();
cio.on("streamingdata", function (msg) {
  $(".input-div").hide();
  $(".controls").show();
  $("#logs").show();
  $("#logs").append($("<p>").text(msg));
  if ($("#stickToBottom").is(":checked")) {
    var objDiv = document.getElementById("logs");
    objDiv.scrollTop = objDiv.scrollHeight;
  }
});

cio.on("connectionEstablished", function (msg) {
  $("#filePath").empty();

  let { files, passwordRequired } = msg;

  if (!passwordRequired) {
    $("#password").hide();
  }
  $("#filePath").append(
    `<option value="" selected disabled>Please Select</option>`
  );

  for (var i = 0; i < files.length; i++) {
    $("#filePath").append(
      `<option value="${files[i].path}">${files[i].name}</option>`
    );
  }
});

cio.on("disconnect", function () {
  cio.disconnect();
});

cio.on("warningmsg", function (msg) {
  $("#warningElemet").html("<b>" + msg + "</b>");
});

cio.on("successmsg", function (msg) {
  $("#successElement").html("<b>" + msg + "</b>");
});

function viewlogs() {
  $("#successElement").html("");
  $("#warningElemet").html("");
  const filePath = $("#filePath").val() || "";
  const password = $("#password").val() || "";
  if (filePath == "" || filePath == undefined || filePath == null) {
    alert("Please select log file to watch");
    return false;
  }
  $("#logs").empty();
  cio.emit("viewlogs", { filePath, password });
}

$("#stickToBottom").change(function () {
  var objDiv = document.getElementById("logs");
  objDiv.scrollTop = objDiv.scrollHeight;
});

function clearLog() {
  if (confirm("Are you sure you want to clear screen?")) {
    $("#logs").empty();
  }
}

function closeWatch() {
  if (confirm("Are you sure you close watch?")) {
    cio.disconnect();
    window.location.reload();
  }
}
