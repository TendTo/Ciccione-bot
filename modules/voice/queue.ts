export interface Audio {
  title: string;
  path: string;
  duration: number;
  link?: string;
}

export class VoiceQueue {
  private _queue: Audio[] = [];

  get queue() {
    return this._queue;
  }

  get current() {
    return this._queue[0];
  }

  get length() {
    return this._queue.length;
  }

  get totalDuration() {
    return this._queue.reduce((acc, cur) => acc + cur.duration, 0);
  }

  addAudio(audioPath: Audio) {
    this._queue.push(audioPath);
  }

  pop() {
    return this._queue.shift();
  }

  clear() {
    this._queue = this._queue.slice(0, 1);
  }

  skip() {
    this._queue = this._queue.slice(1);
  }

  isEmpty() {
    return this._queue.length === 0;
  }

  onlyOne() {
    return this._queue.length === 1;
  }
}
