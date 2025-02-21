import { describe, expect, it } from "vitest"
import Artifact from "../lib/utils/artifact"

describe("replaceFilename", () => {
  const { replaceFilename } = Artifact

  it("should rename file keeping original extension", () => {
    expect(replaceFilename("original.jpg", "new")).toBe("new.jpg")
    expect(replaceFilename("original.png", "new.txt")).toBe("new.png")
  })

  it("should handle files with multiple dots", () => {
    expect(replaceFilename("image.1.jpg", "new")).toBe("new.jpg")
    expect(replaceFilename("file.test.pdf", "new.name")).toBe("new.pdf")
  })

  it("should handle files without extension", () => {
    expect(replaceFilename("filename", "new")).toBe("new")
    expect(replaceFilename("filename", "new.txt")).toBe("new")
  })
})
