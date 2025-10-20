import { dialogueData } from "./constants"

export function displayDialogue(
  text: keyof typeof dialogueData,
  dialogueUI: HTMLDivElement,
  dialogueText: HTMLParagraphElement,
  onDisplayEnd: () => void,
) {
  const dialogue = dialogueData[text]
  let index = 0
  let currentText = ""
  dialogueUI.style.display = "block"

  const intervalRef = setInterval(() => {
    if (index < dialogue.length) {
      currentText += dialogue[index]
      dialogueText.innerHTML = currentText
      index++
      return
    }

    clearInterval(intervalRef)
  }, 5)

  const closeBtn = dialogueUI.querySelector("#close")

  function onCloseBtnClick() {
    onDisplayEnd()
    dialogueUI.style.display = "none"
    dialogueText.innerHTML = ""
    clearInterval(intervalRef)
    closeBtn?.removeEventListener("click", onCloseBtnClick)
  }

  closeBtn?.addEventListener("click", onCloseBtnClick)
}

export function setCamScale(k: any) {
  const resizeFactor = k.width() / k.height()
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1))
    return
  }

  k.camScale(k.vec2(1.5))
}
