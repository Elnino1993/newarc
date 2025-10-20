"use client"

import { useEffect, useRef } from "react"
import { initKaboom } from "@/lib/kaboom-ctx"
import { scaleFactor } from "@/lib/constants"
import { displayDialogue, setCamScale } from "@/lib/utils-game"

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dialogueUIRef = useRef<HTMLDivElement>(null)
  const dialogueTextRef = useRef<HTMLParagraphElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !dialogueUIRef.current || !dialogueTextRef.current || !closeButtonRef.current) return

    const k = initKaboom(canvasRef.current)

    k.loadSprite("spritesheet", "/spritesheet.png", {
      sliceX: 39,
      sliceY: 31,
      anims: {
        "idle-down": 936,
        "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
        "idle-side": 975,
        "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
        "idle-up": 1014,
        "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
      },
    })

    k.loadSprite("map", "/map.png")

    k.setBackground(k.Color.fromHex("#311047"))

    k.scene("main", async () => {
      const mapData = await (await fetch("/map.json")).json()
      const layers = mapData.layers

      const map = k.add([k.sprite("map"), k.pos(0), k.scale(scaleFactor)])

      const player = k.make([
        k.sprite("spritesheet", { anim: "idle-down" }),
        k.area({
          shape: new k.Rect(k.vec2(0, 3), 10, 10),
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
          speed: 250,
          direction: "down",
          isInDialogue: false,
        },
        "player",
      ])

      for (const layer of layers) {
        if (layer.name === "boundaries") {
          for (const boundary of layer.objects) {
            map.add([
              k.area({
                shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
              }),
              k.body({ isStatic: true }),
              k.pos(boundary.x, boundary.y),
              boundary.name,
            ])

            if (boundary.name) {
              player.onCollide(boundary.name, () => {
                player.isInDialogue = true
                displayDialogue(boundary.name, dialogueUIRef.current!, dialogueTextRef.current!, () => {
                  player.isInDialogue = false
                })
              })
            }
          }

          continue
        }

        if (layer.name === "spawnpoints") {
          for (const entity of layer.objects) {
            if (entity.name === "player") {
              player.pos = k.vec2((map.pos.x + entity.x) * scaleFactor, (map.pos.y + entity.y) * scaleFactor)
              k.add(player)
              continue
            }
          }
        }
      }

      setCamScale(k)

      k.onResize(() => {
        setCamScale(k)
      })

      k.onUpdate(() => {
        k.camPos(player.worldPos().x, player.worldPos().y - 100)
      })

      k.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left" || player.isInDialogue) return

        const worldMousePos = k.toWorld(k.mousePos())
        player.moveTo(worldMousePos, player.speed)

        const mouseAngle = player.pos.angle(worldMousePos)

        const lowerBound = 50
        const upperBound = 125

        if (mouseAngle > lowerBound && mouseAngle < upperBound && player.curAnim() !== "walk-up") {
          player.play("walk-up")
          player.direction = "up"
          return
        }

        if (mouseAngle < -lowerBound && mouseAngle > -upperBound && player.curAnim() !== "walk-down") {
          player.play("walk-down")
          player.direction = "down"
          return
        }

        if (Math.abs(mouseAngle) > upperBound) {
          player.flipX = false
          if (player.curAnim() !== "walk-side") player.play("walk-side")
          player.direction = "right"
          return
        }

        if (Math.abs(mouseAngle) < lowerBound) {
          player.flipX = true
          if (player.curAnim() !== "walk-side") player.play("walk-side")
          player.direction = "left"
          return
        }
      })

      function stopAnims() {
        if (player.direction === "down") {
          player.play("idle-down")
          return
        }
        if (player.direction === "up") {
          player.play("idle-up")
          return
        }

        player.play("idle-side")
      }

      k.onMouseRelease(stopAnims)

      k.onKeyRelease(() => {
        stopAnims()
      })

      k.onKeyDown("left", () => {
        if (player.isInDialogue) return
        player.flipX = true
        if (player.curAnim() !== "walk-side") player.play("walk-side")
        player.direction = "left"
        player.move(-player.speed, 0)
      })

      k.onKeyDown("right", () => {
        if (player.isInDialogue) return
        player.flipX = false
        if (player.curAnim() !== "walk-side") player.play("walk-side")
        player.direction = "right"
        player.move(player.speed, 0)
      })

      k.onKeyDown("up", () => {
        if (player.isInDialogue) return
        if (player.curAnim() !== "walk-up") player.play("walk-up")
        player.direction = "up"
        player.move(0, -player.speed)
      })

      k.onKeyDown("down", () => {
        if (player.isInDialogue) return
        if (player.curAnim() !== "walk-down") player.play("walk-down")
        player.direction = "down"
        player.move(0, player.speed)
      })
    })

    k.go("main")

    closeButtonRef.current.addEventListener("click", () => {
      if (dialogueUIRef.current) {
        dialogueUIRef.current.style.display = "none"
      }
    })
  }, [])

  return (
    <>
      <style jsx global>{`
        @font-face {
          font-family: 'monogram';
          src: url('/monogram.ttf') format('truetype');
        }

        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        #dialogue-ui {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          display: none;
          background-color: rgba(0, 0, 0, 0.66);
          z-index: 2;
        }

        #textbox-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70%;
          height: 40%;
          background-color: white;
          border: 6px solid black;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        #dialogue {
          font-family: 'monogram', monospace;
          font-size: 32px;
          color: black;
          flex: 1;
          overflow-y: auto;
          line-height: 1.5;
        }

        #close {
          font-family: 'monogram', monospace;
          font-size: 24px;
          background-color: black;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          align-self: flex-end;
          margin-top: 8px;
        }

        #close:hover {
          background-color: #333;
        }

        .instruction {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'monogram', monospace;
          font-size: 24px;
          color: white;
          background-color: rgba(0, 0, 0, 0.7);
          padding: 12px 24px;
          border-radius: 8px;
          z-index: 1;
        }
      `}</style>

      <canvas ref={canvasRef} />

      <div className="instruction">Tap/Click around to move</div>

      <div id="dialogue-ui" ref={dialogueUIRef}>
        <div id="textbox-container">
          <p id="dialogue" ref={dialogueTextRef}></p>
          <button id="close" ref={closeButtonRef}>
            Close
          </button>
        </div>
      </div>
    </>
  )
}
