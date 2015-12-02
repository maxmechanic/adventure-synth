/*global AudioContext:false, webkitAudioContext:false*/

function buildLowshelf (context) {
  const lowshelf = context.createBiquadFilter()

  lowshelf.type = 'lowshelf'
  lowshelf.frequency.value = 750
  lowshelf.Q.value = 100
  lowshelf.gain.value = 30

  return lowshelf
}

function buildNotch (context) {
  const notch = context.createBiquadFilter()

  notch.type = 'notch'
  notch.frequency.value = 2000

  return notch
}

function buildOscillators (context, connectionNode, initialFreq = 40) {
  return oscSettings.map(settings => {
    const osc = context.createOscillator()

    osc.type = settings.type
    osc.frequency.value = initialFreq
    osc.detune.value = settings.detune

    osc.connect(connectionNode)

    return osc
  })
}

function isAudioContext (context) {
  return context instanceof AudioContext || context instanceof webkitAudioContext
}

const oscSettings = [
  {type: 'sawtooth', detune: -10},
  {type: 'sawtooth', detune: -12},
  {type: 'sawtooth', detune: 0},
  {type: 'sawtooth', detune: 15},
  {type: 'triangle', detune: 10}
]

class AdventureSynth {
  constructor (context, mainFreq = 40) {
    if (!isAudioContext(context)) {
      throw Error('Must provide AudioContext')
    }

    this.context = context
    this.mainFreq = mainFreq

    const notch = buildNotch(context)
    const lowshelf = buildLowshelf(context)

    const gain = context.createGain()
    gain.gain.setValueAtTime(0.10, context.currentTime)

    const finalGain = context.createGain()
    finalGain.gain.setValueAtTime(0.9, context.currentTime)
    var compressor = context.createDynamicsCompressor()
    compressor.threshold.value = -45
    compressor.knee.value = 40
    compressor.attack.value = 0.15
    compressor.release.value = 0.45
    compressor.ratio.value = 16
    compressor.reduction.value = -80

    notch.connect(lowshelf)
    lowshelf.connect(gain)
    gain.connect(compressor)
    compressor.connect(finalGain)

    this.oscillators = buildOscillators(context, notch, mainFreq)

    this.changeFreq = this.changeFreq.bind(this)

    this.nodes = [
      ...this.oscillators,
      notch,
      lowshelf,
      gain,
      finalGain
    ]
  }

  connect (node) {
    const finalNode = this.nodes.slice(-1)[0]
    finalNode.connect(node)

    return this
  }

  start (time) {
    const { oscillators, context } = this
    const startTime = time || context.currentTime

    oscillators.forEach(
      osc => osc.start(startTime)
    )

    return this
  }

  stop (time) {
    const { oscillators, context } = this
    const stopTime = time || context.currentTime

    oscillators.forEach(
      osc => osc.stop(stopTime)
    )

    return this
  }

  changeFreq (freq) {
    const { oscillators, context } = this

    oscillators.forEach(osc =>
      osc.frequency.setValueAtTime(freq, context.currentTime)
    )

    return this
  }

  changeGain (gain) {
    const { nodes, context } = this

    const finalNode = nodes.slice(-1)[0]
    finalNode.gain.setValueAtTime(gain, context.currentTime)

    return this
  }

}

export default AdventureSynth
