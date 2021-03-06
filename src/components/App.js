import React, { Component } from 'react'
import '../css/App.css'
import { openings, endings, osts, shuffle } from '../data'
import { keys, iconSize } from '../constants'
import MenuItemInfo from './MenuItemInfo'
import MenuItemPreferences from './MenuItemPreferences'
import Player from './Player'
import Playlist from './Playlist'
import { TiArrowLeftThick, TiArrowRightThick } from 'react-icons/lib/ti'
import { FaRefresh, FaExpand, FaStar, FaBars } from 'react-icons/lib/fa'

const initialData = shuffle([...openings, ...endings, ...osts])

class App extends Component {
  state = {
    data: initialData,
    trackName: initialData[0].name,
    src: initialData[0].link,
    bgImg: initialData[0].img,
    isFullscreen: false,
    isPlaying: false,
    showPlaylist: false,
    percentComplete: 0,
    percentBuffered: 0,
    preference: {
      opening: true,
      ending: true,
      ost: true,
      favourites: false
    }
  }
  togglePlay = () => {
    this.setState({ isPlaying: !this.audio.paused }, () => {
      this.audio[this.state.isPlaying ? 'pause' : 'play']()
    })
  }
  toggleFullscreen = () => {
    const { isFullscreen } = this.state
    if (isFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen()
      else if (document.msExitFullscreen) document.msExitFullscreen()
    } else {
      const e = document.documentElement
      if (e.requestFullscreen) e.requestFullscreen()
      else if (e.webkitRequestFullscreen) e.webkitRequestFullscreen()
      else if (e.mozRequestFullScreen) e.mozRequestFullScreen()
      else if (e.msRequestFullscreen) e.msRequestFullscreen()
    }
    this.setState({ isFullscreen: !isFullscreen })
  }
  nextTrack = () => {
    this.state.data.push(this.state.data.shift())
    const track = this.state.data[0]
    this.setState({
      src: track.link,
      bgImg: track.img,
      trackName: track.name
    })
  }
  previousTrack = () => {
    this.state.data.unshift(this.state.data.pop())
    const track = this.state.data[0]
    this.setState({
      src: track.link,
      bgImg: track.img,
      trackName: track.name
    })
  }
  restartTrack = () => {
    this.audio.currentTime = 0
  }
  rewindTrack = () => {
    this.audio.currentTime = Math.max(0, this.audio.currentTime - 10) || 0
    this.showTempTrackDisplay(
      <span className="icon iconRewind">
        {this.formatCurrentTime(parseInt(this.audio.currentTime, 10))}
      </span>
    )
  }
  forwardTrack = () => {
    const { duration, currentTime } = this.audio
    this.audio.currentTime = Math.min(duration, currentTime + 10) || 0
    this.showTempTrackDisplay(
      <span className="icon iconFastforward">
        {this.formatCurrentTime(parseInt(this.audio.currentTime, 10))}
      </span>
    )
  }
  formatCurrentTime = currentTime => {
    const mins = Math.floor(currentTime / 60)
      .toString()
      .padStart(2, '0')
    const secs = (currentTime - mins * 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }
  timeUpdate = e => {
    const { currentTime, duration } = e.target
    const percentComplete = (currentTime / duration * 100).toFixed(2)
    this.setState({ percentComplete })
  }
  progressUpdate = e => {
    const { buffered, duration } = e.target
    if (buffered.length) {
      const lastTimeRangeIndex = buffered.length - 1
      const percentBuffered = buffered.end(lastTimeRangeIndex) / duration * 100
      this.setState({ percentBuffered })
    }
  }
  handleKeyboardEvents = ({ keyCode }) => {
    switch (keyCode) {
      case keys.SPACE:
        this.togglePlay()
        break
      case keys.N:
        this.nextTrack()
        break
      case keys.R:
        this.restartTrack()
        break
      case keys.F:
        this.toggleFullscreen()
        break
      case keys.L:
        this.previousTrack()
        break
      case keys.LEFT_ARROW:
        this.rewindTrack()
        break
      case keys.UP_ARROW:
        this.volumeUp()
        break
      case keys.RIGHT_ARROW:
        this.forwardTrack()
        break
      case keys.DOWN_ARROW:
        this.volumeDown()
        break
      default:
        return
    }
  }
  allFalse = obj => {
    const checkStatus = element => element === false
    const values = Object.values(obj)
    const status = values.every(checkStatus)
    return status
  }
  togglePreference = e => {
    const { name } = e.target
    let { preference } = this.state
    let data
    preference[name] = !preference[name]
    if (this.allFalse(preference)) {
      preference[name] = true
    }
    data = shuffle([
      ...(preference.opening ? openings : []),
      ...(preference.ending ? endings : []),
      ...(preference.ost ? osts : [])
    ])
    if (preference.favourites) {
      data = this.filterFavourites(data)
    }
    this.setState({ preference, data })
  }
  showTempTrackDisplay = tempDisplayStr => {
    this.setState({ trackName: tempDisplayStr }, () => {
      clearTimeout(this.trackDisplayQueue)
      this.trackDisplayQueue = setTimeout(() => {
        this.setState({
          trackName: this.state.data[0].name
        })
      }, 1000)
    })
  }
  volumeUp = () => {
    this.audio.volume = Math.min(
      1,
      Math.round((this.audio.volume + 0.1) * 10) / 10
    )
    this.showTempTrackDisplay(
      <span className="icon iconVolumeUp">
        {parseInt(this.audio.volume * 100, 10)}
      </span>
    )
  }
  volumeDown = () => {
    this.audio.volume = Math.max(
      0,
      Math.round((this.audio.volume - 0.1) * 10) / 10
    )
    this.showTempTrackDisplay(
      <span className="icon iconVolumeDown">
        {parseInt(this.audio.volume * 100, 10)}
      </span>
    )
  }
  handleTrackScrub = e => {
    this.audio.currentTime = e.target.value / 100 * this.audio.duration
  }
  isFavourite = (songName = this.state.trackName) => {
    return localStorage.getItem(songName)
  }
  toggleFavourite = () => {
    this.isFavourite()
      ? localStorage.removeItem(this.state.trackName)
      : localStorage.setItem(this.state.trackName, true)
  }
  filterFavourites = songList => {
    return songList.filter(song => {
      return this.isFavourite(song.name)
    })
  }

  toggleDisplayPlaylist = () => {
    this.setState({
      showPlaylist: !this.state.showPlaylist
    })
  }

  handleAppClicks = e => {
    if (e.target.className === 'App' && this.state.showPlaylist) {
      this.toggleDisplayPlaylist()
    } else if (e.target.className === 'App') {
      this.togglePlay()
    } else return
  }

  handleSongClick = name => {
    let data = this.state.data
    data.some((obj, index) => {
      if (obj.name === name) {
        let removed_tracks = data.slice(0, index)
        data.splice(0, removed_tracks.length)
        data = data.concat(removed_tracks)
        this.setState({
          trackName: obj.name,
          src: obj.link,
          bgImg: obj.img,
          data
        })
        return true
      }
    })
  }

  componentDidMount() {
    document.addEventListener('keyup', this.handleKeyboardEvents)
    document.addEventListener('click', this.handleAppClicks)
  }
  componentWillUnmount() {
    document.removeEventListener('keyup', this.handleKeyboardEvents)
  }
  trackDisplayQueue = undefined
  render() {
    return (
      <div
        className="App"
        style={{ backgroundImage: `url(${this.state.bgImg})` }}
      >
        <audio
          ref={a => {
            this.audio = a
          }}
          src={this.state.src}
          onCanPlay={() => {
            if (this.audio.paused) {
              this.togglePlay()
            }
          }}
          onTimeUpdate={this.timeUpdate}
          onProgress={this.progressUpdate}
        />

        {/* Top-bar components */}
        <Playlist
          data={this.state.data}
          toggleDisplayPlaylist={this.toggleDisplayPlaylist}
          showPlaylist={this.state.showPlaylist}
          handleSongClick={this.handleSongClick}
        />
        <div className="top-bar">
          <Player
            percentComplete={this.state.percentComplete}
            handleTrackScrub={this.handleTrackScrub}
            percentBuffered={this.state.percentBuffered}
          />
          <div className="top-buttons">
            <div className="top-left">
              <button
                onClick={this.toggleDisplayPlaylist}
                title="Playlist"
                className="btn"
              >
                <FaBars size={iconSize} className="icons" />
              </button>
            </div>
            <div className="top-right">
              <button
                onClick={this.toggleFavourite}
                title="Toggle Favourite"
                className="btn"
              >
                <FaStar size={iconSize} className="icons" />
              </button>
              <MenuItemInfo />
              <MenuItemPreferences
                togglePreferenceState={this.togglePreference}
                preferenceState={this.state.preference}
              />
            </div>
          </div>
        </div>

        <div className="display-track">
          {this.state.trackName && (
            <div id="track-name">{this.state.trackName}</div>
          )}
        </div>

        <div className="bottom-bar">
          <div className="bottom-left">
            <button
              onClick={this.previousTrack}
              title="Play Previous"
              className="btn"
            >
              <TiArrowLeftThick size={iconSize} className="icons" />
            </button>
            <button onClick={this.nextTrack} title="Play Next" className="btn">
              <TiArrowRightThick size={iconSize} className="icons" />
            </button>
          </div>

          <div className="botton-right">
            <button
              onClick={this.restartTrack}
              title="Replay Track"
              className="btn"
            >
              <FaRefresh size={iconSize} className="icons" />
            </button>
            <button
              onClick={this.toggleFullscreen}
              title="Toggle Fullscreen"
              className="btn"
            >
              <FaExpand size={iconSize} className="icons" />
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default App
