import artifact from "../lib/artifact"
import capture from "../lib/capture"
;(async () => {
  try {
    const { contentType, stream } = await capture({
      url: "https://www.example.com",
    })
    const path = await artifact.save(stream, "example.png")
    console.log(path)
  } catch (error) {
    console.log(error)
  }
})()
