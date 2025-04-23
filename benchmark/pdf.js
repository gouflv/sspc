const autocannon = require("autocannon")

const DURATION = 60

const instance = autocannon({
  url: "http://10.0.28.121:3001/jobs/urgent",
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    pages: [
      {
        url: "https://news.baidu.com/",
        name: "example",
      },
    ],
    captureFormat: "pdf",
    pdfFormat: "a4",
  }),
  connections: 20,
  duration: DURATION,
  timeout: DURATION * 10,
})

autocannon.track(instance, { renderProgressBar: true })

process.once("SIGINT", () => {
  instance.stop()
})
