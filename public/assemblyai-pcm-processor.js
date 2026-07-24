class AssemblyAiPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.ratio = sampleRate / this.targetSampleRate;
    this.nextInputIndex = 0;
    this.samples = [];
    this.samplesPerChunk = 1600;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    let index = this.nextInputIndex;
    while (index < input.length) {
      this.samples.push(input[Math.floor(index)] ?? 0);
      index += this.ratio;
    }
    this.nextInputIndex = index - input.length;

    while (this.samples.length >= this.samplesPerChunk) {
      const output = new Int16Array(this.samplesPerChunk);
      for (let i = 0; i < this.samplesPerChunk; i += 1) {
        const value = Math.max(-1, Math.min(1, this.samples[i]));
        output[i] = value < 0 ? value * 32768 : value * 32767;
      }
      this.samples.splice(0, this.samplesPerChunk);
      this.port.postMessage(output.buffer, [output.buffer]);
    }
    return true;
  }
}

registerProcessor('assemblyai-pcm-processor', AssemblyAiPcmProcessor);
