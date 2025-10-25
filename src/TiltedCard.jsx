import { useRef } from 'react'
import './TiltedCard.css'

export default function TiltedCard({
  imageSrc,
  altText = '',
  captionText = '',
  containerHeight, // optional — if omitted, let content define height
  containerWidth = '100%',
  imageHeight = '200px',
  imageWidth = '100%',
  rotateAmplitude = 12,
  scaleOnHover = 1.06,
  showMobileWarning = false,
  children,
}) {
  const ref = useRef(null)

  function onMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = (x / rect.width) * 2 - 1 // -1..1
    const py = (y / rect.height) * 2 - 1
    const rx = (-py) * rotateAmplitude
    const ry = (px) * rotateAmplitude
    el.style.setProperty('--tilt-rotate-x', rx.toFixed(2) + 'deg')
    el.style.setProperty('--tilt-rotate-y', ry.toFixed(2) + 'deg')
    el.style.setProperty('--tilt-scale', scaleOnHover)
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tilt-rotate-x', '0deg')
    el.style.setProperty('--tilt-rotate-y', '0deg')
    el.style.setProperty('--tilt-scale', '1')
  }

  const style = { width: containerWidth }
  if (containerHeight) style.height = containerHeight

  return (
    <div
      ref={ref}
      className="tilted-card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
    >
      {children ? (
        children
      ) : (
        <>
          <img
            className="tilted-card-image"
            src={imageSrc}
            alt={altText}
            style={{ width: imageWidth, height: imageHeight }}
          />
          {captionText ? <div className="tilted-card-caption">{captionText}</div> : null}
          {showMobileWarning ? (
            <div className="tilted-card-tip">Tip: tilt/hover works best on desktop</div>
          ) : null}
        </>
      )}
    </div>
  )
}
