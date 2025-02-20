import artifact from "../lib/utils/artifact"
;(async () => {
  const path = await artifact.packageArtifacts(
    [
      {
        filename: "example.png",
        distName: "dist.png",
      },
    ],
    "pkg.zip",
  )
  console.log(path)
})()
