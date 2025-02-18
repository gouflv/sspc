import artifact from "../lib/utils/artifact"
;(async () => {
  const path = await artifact.packageArtifacts(["example.png"], "pkg.zip")
  console.log(path)
})()
