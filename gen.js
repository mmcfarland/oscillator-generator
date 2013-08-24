var Sound = function() {
    this.ac = new webkitAudioContext();    
    this._volume = this.ac.createGain();
    this._volume.connect(this.ac.destination);
    this._numOsc = 0.0;
    this.setVolume(0.9);
    this._chords = [];

    this._halfStep = Math.pow(2, (1/12));
    this._wholeStep = Math.pow(2, (1/6));

    this._steps = {'w': this._wholeStep, 'h': this._halfStep};

    this.notes = {
        a: 220.0,
        b: 246.94,
        c: 261.63,
        d: 293.66,
        e: 329.63,
        f: 349.23,
        g: 392.00
    };

    this.scales = {
        major: ['w', 'w', 'h', 'w', 'w', 'w', 'h'],
        minor: ['w', 'h', 'w', 'w', 'h', 'w', 'w']

    };

}

Sound.prototype.addOscillator = function() {
    var oldNumOsc = this._numOsc;
    this._numOsc = this._numOsc + 1.0;
    console.log('osc#: ' + this._numOsc);
    this.setVolume(this._volume.gain.value * (oldNumOsc || 1));
    return this.ac.createOscillator();
}

Sound.prototype.removeOscillator = function() {
    var oldNumOsc = this._numOsc;
    this._numOsc = this._numOsc - 1.0;
    this.setVolume(this._volume.gain.value*oldNumOsc);
}

Sound.prototype.play = function(freq) {
    console.log('play: ' + freq);
    this.stop();
    this.osc = this.addOscillator();
    this.osc.frequency.value = freq;
    this.osc.connect(this._volume);
    this.osc.noteOn(0);
}

Sound.prototype.playScaleProgression = function(root, scale) {
    // Start out at the given frequency, and play
    // each note briefly in the computed scale.
    var self = this,
        idx = 0,
        step = root,
        il = setInterval(function() {
            step = step * self._steps[scale[idx++]];   
            self.play(step);
            if (idx >= scale.length) clearInterval(il);
        }, 700);

    self.play(root);
}

Sound.prototype.playChord = function(freqs) {
    var self = this;
    var curChord = [];
    freqs.forEach(function(f) {
        var o = self.addOscillator();
        o.frequency.value = f;
        o.connect(self._volume);
        curChord.push(o);
    });

    curChord.forEach(function(o) {
        o.noteOn(0);
    });

    return self._chords.push(curChord);
}

Sound.prototype.stop = function() {
    if (this.osc) this.osc.noteOff(0);
}

Sound.prototype.stopChord = function(i) {
    var self = this;
    function off(c) {
        c.forEach(function(o) {
            self.removeOscillator();
            o.noteOff(0);
        });
    }

    // If no index, turn off all chords, otherwise
    // turn of specific chord by index
    if (i == undefined) {
        this._chords.forEach(function(chord) {
            off(chord);
        });
    } else {
        off(this._chords[i]);
    }
}

Sound.prototype.playFile = function(url) {
    var self = this;
    var buff = 0;
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var play = function(b) {
        self._bgSource = self.ac.createBufferSource()
        self._bgSource.buffer = b;
        var volume = self.ac.createGain();
        volume.connect(self.ac.destination);
        volume.gain.value = 0.10;
        self._bgSource.connect(volume);
        self._bgSource.noteOn(0); 
    };

    var source = self.ac.createBufferSource();
    request.onload = function() {
        // Read the white noise and play it on a loop
        self.ac.decodeAudioData(request.response,
            function(buffer) {
                play(buffer);
                self.bgTimer = setInterval(function() {
                    play(buffer);
                }, 8000);
            }    
        );
    }

    request.send();
}

Sound.prototype.stopBackground = function() {
    var self = this;
    clearInterval(self.bgTimer);
    self.bgTimer = 0;
    this._bgSource.noteOff(0);
}

Sound.prototype.setVolume = function(vol) {
    this._volume.gain.value = vol/this._numOsc;
    console.log(this._volume.gain.value);
}

