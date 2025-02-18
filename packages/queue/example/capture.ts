import artifact from "../lib/utils/artifact"
import capture from "../lib/utils/capture"
;(async () => {
  try {
    const { contentType, stream } = await capture("example", {
      url: "https://www.example.com",
    })
    const path = await artifact.save(stream, "example.png")
    console.log(path)
  } catch (error) {
    console.log(error)
  }
})()
