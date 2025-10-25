import './BanterLoader.css'

export default function BanterLoader({ message = 'Loading...' }) {
  return (
    <div className="banter-loader-overlay">
      <div className="banter-loader">
        <div className="banter-loader__box"></div>
        <div className="banter-loader__box"></div>
        <div className="banter-loader__box"></div>
        <div className="banter-loader__box"></div>
        <div className="banter-loader__box"></div>
        <div className="banter-loader__box"></div>
        <div className="banter-loader__box"></div>
        <div className="banter-loader__box"></div>
        <div className="banter-loader__box"></div>
      </div>
      {message && <div className="banter-loader-message">{message}</div>}
    </div>
  )
}
