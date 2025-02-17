import Artifact from "../lib/artifact"
;(async () => {
  const path = await Artifact.packageArtifacts(["example.png"], "pkg.zip")
  console.log(path)
})()
