class VolumeMeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.volume = 0;
    this.smoothingFactor = 0.8;
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputChannel = input[0];
      let sum = 0;
      
      for (let i = 0; i < inputChannel.length; i++) {
        sum += inputChannel[i] * inputChannel[i];
      }
      
      const rms = Math.sqrt(sum / inputChannel.length);
      this.volume = Math.max(rms, this.volume * this.smoothingFactor);
      
      this.port.postMessage({ volume: this.volume });
    }
    
    return true;
  }
}

registerProcessor('vol-meter', VolumeMeterProcessor);
