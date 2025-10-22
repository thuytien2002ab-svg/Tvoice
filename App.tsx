import React, { useState, useEffect, useCallback } from 'react';
import { generateSpeech } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import { SpeakerWaveIcon, SpeakerXMarkIcon, ArrowPathIcon, KeyIcon } from './components/Icons';

const voices = [
  { name: 'Kore', gender: 'Female' },
  { name: 'Luna', gender: 'Female' },
  { name: 'Puck', gender: 'Female' },
  { name: 'Aura', gender: 'Female' },
  { name: 'Stella', gender: 'Female' },
  { name: 'Charon', gender: 'Male' },
  { name: 'Fenrir', gender: 'Male' },
  { name: 'Zephyr', gender: 'Male' },
  { name: 'Orion', gender: 'Male' },
  { name: 'Sol', gender: 'Male' },
];

const App: React.FC = () => {
  const [text, setText] = useState<string>('Xin chào! Tôi là một trợ lý AI thân thiện được cung cấp bởi Gemini. Hãy nhập nội dung vào đây và tôi sẽ đọc nó cho bạn.');
  const [selectedVoice, setSelectedVoice] = useState<string>(voices[0].name);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // API Key state
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySet, setIsKeySet] = useState<boolean>(false);

  // Voice style state
  const [speakingRate, setSpeakingRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);
  const [volumeGainDb, setVolumeGainDb] = useState<number>(0);
  
  // Word and character count state
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);


  useEffect(() => {
    setAudioContext(new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }));
  }, []);

  useEffect(() => {
    // Calculate word and character counts
    const trimmedText = text.trim();
    setCharCount(text.length);
    if (trimmedText === '') {
      setWordCount(0);
    } else {
      const words = trimmedText.split(/\s+/);
      setWordCount(words.length);
    }
  }, [text]);

  const stopPlayback = useCallback(() => {
    if (audioSource) {
      audioSource.stop();
      audioSource.disconnect();
      setAudioSource(null);
      setIsPlaying(false);
    }
  }, [audioSource]);
  
  const resetStyles = () => {
    setSpeakingRate(1.0);
    setPitch(0);
    setVolumeGainDb(0);
  };
  
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setIsKeySet(true);
      setError(null);
    } else {
      setError("Vui lòng nhập khóa API Gemini của bạn.");
    }
  };

  const handleSpeak = async () => {
    if (!text.trim() || !audioContext) {
      setError("Vui lòng nhập văn bản để nói.");
      return;
    }
    
    stopPlayback(); // Stop any currently playing audio
    setIsLoading(true);
    setError(null);

    try {
      const base64Audio = await generateSpeech(apiKey, text, selectedVoice, speakingRate, pitch, volumeGainDb);
      if (!base64Audio) {
        throw new Error("API không trả về dữ liệu âm thanh. Vui lòng thử lại.");
      }

      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);

      source.onended = () => {
        setIsPlaying(false);
        setAudioSource(null);
      };

      setAudioSource(source);
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra một lỗi không xác định.";
      setError(errorMessage);
       // If the error suggests an invalid API key, prompt the user again.
      if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('invalid')) {
        setIsKeySet(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const CustomSlider: React.FC<{
    id: string;
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    displayValue: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
  }> = ({ id, label, value, min, max, step, displayValue, onChange, disabled }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <label htmlFor={id}>{label}</label>
        <span>{displayValue}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed 
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
  
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 border border-slate-700">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400">Gemini Chuyển văn bản thành giọng nói</h1>
            <p className="text-slate-400 mt-2">Làm cho văn bản của bạn trở nên sống động với giọng nói của AI.</p>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
              <p><span className="font-bold">Lỗi:</span> {error}</p>
            </div>
          )}

          {!isKeySet ? (
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-300">
                Nhập khóa API Gemini của bạn
              </label>
              <div className="flex items-center gap-2">
                 <KeyIcon className="h-5 w-5 text-slate-500" />
                 <input
                  id="api-key-input"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200"
                  placeholder="Dán khóa API của bạn vào đây"
                />
              </div>
              <p className="text-xs text-slate-500">
                Bạn có thể lấy khóa API từ <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a>. Khóa của bạn chỉ được lưu trong phiên này.
              </p>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors bg-cyan-600 hover:bg-cyan-500 focus:ring-4 focus:ring-cyan-500/50"
              >
                Lưu khóa
              </button>
            </form>
          ) : (
            <>
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsKeySet(false)}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Thay đổi khóa API
                </button>
              </div>
              <div>
                <label htmlFor="text-input" className="block text-sm font-medium text-slate-300 mb-2">
                  Nhập văn bản
                </label>
                <textarea
                  id="text-input"
                  rows={6}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 resize-none"
                  placeholder="Nhập hoặc dán văn bản của bạn tại đây..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isLoading}
                />
                 <div className="text-right text-xs text-slate-400 mt-1 pr-1">
                    <span>{wordCount} từ / {charCount} ký tự</span>
                </div>
              </div>

              <div className="space-y-4">
                <label htmlFor="voice-select" className="block text-sm font-medium text-slate-300">
                  Chọn giọng nói
                </label>
                <select
                  id="voice-select"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 appearance-none bg-no-repeat bg-right-4"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={isLoading}
                >
                  <optgroup label="Giọng nữ" className="bg-slate-700 text-slate-300 font-semibold">
                    {voices.filter(v => v.gender === 'Female').map((voice) => (
                      <option key={voice.name} value={voice.name} className="bg-slate-800 text-white">
                        {voice.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Giọng nam" className="bg-slate-700 text-slate-300 font-semibold">
                    {voices.filter(v => v.gender === 'Male').map((voice) => (
                      <option key={voice.name} value={voice.name} className="bg-slate-800 text-white">
                        {voice.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              
              <div className="space-y-4 pt-2 border-t border-slate-700/50">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-slate-300">Kiểu giọng nói</h3>
                  <button
                    onClick={resetStyles}
                    disabled={isLoading}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                  >
                    Đặt lại kiểu
                  </button>
                </div>
                
                <CustomSlider
                  id="rate-slider"
                  label="Tốc độ nói"
                  value={speakingRate}
                  min={0.5} max={2.0} step={0.05}
                  displayValue={speakingRate.toFixed(2)}
                  onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                  disabled={isLoading}
                />

                <CustomSlider
                  id="pitch-slider"
                  label="Cao độ"
                  value={pitch}
                  min={-10} max={10} step={0.5}
                  displayValue={pitch.toFixed(1)}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  disabled={isLoading}
                />

                <CustomSlider
                  id="volume-slider"
                  label="Âm lượng (dB)"
                  value={volumeGainDb}
                  min={-6} max={6} step={0.5}
                  displayValue={volumeGainDb.toFixed(1)}
                  onChange={(e) => setVolumeGainDb(parseFloat(e.target.value))}
                  disabled={isLoading}
                />
              </div>


              <div className="pt-2">
                <button
                  onClick={isPlaying ? stopPlayback : handleSpeak}
                  disabled={isLoading || !text.trim()}
                  className={`w-full flex items-center justify-center gap-3 text-lg font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4
                    ${isLoading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' :
                      isPlaying ? 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500/50 text-white' :
                      'bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-500/50 text-white disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-6 w-6 animate-spin" />
                      Đang tạo...
                    </>
                  ) : isPlaying ? (
                    <>
                      <SpeakerXMarkIcon className="h-6 w-6" />
                      Dừng
                    </>
                  ) : (
                    <>
                      <SpeakerWaveIcon className="h-6 w-6" />
                      Nói
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;