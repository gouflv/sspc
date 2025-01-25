class Ruler {
  constructor() {
    this.injectStyles()
    this.createRulers()
  }

  injectStyles() {
    const styles = `
      body {
        background-image: linear-gradient(to right, #e5e5e5 1px, transparent 1px),
          linear-gradient(to bottom, #e5e5e5 1px, transparent 1px);
        background-size: 100px 100px;
      }
      .ruler {
        position: fixed;
        background: rgba(200, 200, 200, 0.2);
        z-index: 9999;
      }
      .ruler-h {
        top: 0;
        left: 0;
        width: 100%;
        height: 30px;
      }
      .ruler-v {
        top: 0;
        left: 0;
        width: 50px;
        height: 9999px;
      }
      .ruler::before {
        content: '';
        position: absolute;
        background: #333;
      }
      .ruler-h::before {
        left: 0;
        bottom: 0;
        width: 100%;
        height: 1px;
      }
      .ruler-v::before {
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
      }
      .ruler-mark {
        position: absolute;
        background: #666;
      }
      .ruler-h .ruler-mark {
        width: 1px;
        height: 5px;
        bottom: 0;
      }
      .ruler-h .ruler-mark.major {
        height: 10px;
      }
      .ruler-v .ruler-mark {
        width: 5px;
        height: 1px;
        right: 0;
      }
      .ruler-v .ruler-mark.major {
        width: 10px;
      }
      .ruler-label {
        position: absolute;
        font-size: 10px;
        color: #666;
      }
      .ruler-h .ruler-label {
        top: 2px;
        transform: translateX(-50%);
      }
      .ruler-v .ruler-label {
        right: 22px;
        transform: translateY(-50%);
      }
    `
    const styleSheet = document.createElement("style")
    styleSheet.textContent = styles
    document.head.appendChild(styleSheet)
  }

  createRulers() {
    const horizontalRuler = document.createElement("div")
    horizontalRuler.className = "ruler ruler-h"

    const verticalRuler = document.createElement("div")
    verticalRuler.className = "ruler ruler-v"

    document.body.appendChild(horizontalRuler)
    document.body.appendChild(verticalRuler)

    this.createRulerMarks(horizontalRuler, true)
    this.createRulerMarks(verticalRuler, false)
  }

  createRulerMarks(ruler, isHorizontal) {
    const length = isHorizontal ? window.innerWidth : 9999
    const step = 50

    for (let i = 0; i <= length; i += step) {
      const mark = document.createElement("div")
      mark.className = `ruler-mark${i % 100 === 0 ? " major" : ""}`

      if (isHorizontal) {
        mark.style.left = `${i}px`
      } else {
        mark.style.top = `${i}px`
      }

      if (i % 100 === 0) {
        const label = document.createElement("div")
        label.className = "ruler-label"
        label.textContent = i
        if (isHorizontal) {
          label.style.left = `${i}px`
        } else {
          label.style.top = `${i}px`
        }
        ruler.appendChild(label)
      }

      ruler.appendChild(mark)
    }
  }
}

window.Ruler = Ruler
