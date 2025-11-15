import { useAction } from 'convex/react';
import { Mic, Upload, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { api } from '../../convex/_generated/api';

export function VoiceCloning() {
  const [voiceName, setVoiceName] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const createVoice = useAction(api.elevenlabsActions.createVoice);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    onStop: async (blobUrl, blob) => {
      console.log('Recording stopped', { blobUrl, duration: recordingDuration });
      
      // Get actual duration from the audio blob
      const audio = new Audio(blobUrl);
      audio.addEventListener('loadedmetadata', () => {
        const actualDuration = Math.floor(audio.duration);
        console.log('Actual audio duration:', actualDuration);
        setRecordingDuration(actualDuration);
        
        // Show feedback based on actual duration
        if (actualDuration < 10) {
          toast.warning('Recording processed', {
            description: `Duration: ${actualDuration}s - Need at least 10s for voice cloning`,
          });
        } else {
          toast.success('Recording ready!', {
            description: `${actualDuration} seconds recorded - Ready to upload`,
          });
        }
      });
    },
  });

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'recording') {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else if (status === 'stopped' || status === 'stopping') {
      // Don't reset duration when stopped/stopping, only when cleared
      // Duration will be updated by the actual audio metadata in onStop
    } else if (status === 'idle' || status === 'acquiring_media') {
      // Only reset if we're in idle state without a recording
      if (!mediaBlobUrl) {
        setRecordingDuration(0);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, mediaBlobUrl]);

  const handleStartRecording = () => {
    setRecordingDuration(0);
    setUploadSuccess(false);
    startRecording();
    toast.info('Recording started', {
      description: 'Please record at least 10 seconds of audio',
    });
  };

  const handleStopRecording = () => {
    stopRecording();
    toast.success('Recording stopped', {
      description: 'Processing your recording...',
    });
  };

  const handleUpload = async () => {
    if (!voiceName.trim()) {
      toast.error('Voice name required', {
        description: 'Please enter a name for your voice',
      });
      return;
    }

    if (!mediaBlobUrl) {
      toast.error('No recording found', {
        description: 'Please record your voice first',
      });
      return;
    }

    if (recordingDuration < 10) {
      toast.error('Recording too short', {
        description: 'Please record at least 10 seconds of audio',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Fetch the blob from the URL
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        // Remove the data:audio/wav;base64, prefix
        const base64Data = base64Audio.split(',')[1];

        try {
          await createVoice({
            audio: base64Data,
            name: voiceName,
          });

          toast.success('Voice cloned successfully!', {
            description: `Your voice "${voiceName}" has been created`,
          });
          setUploadSuccess(true);
          setVoiceName('');
          setRecordingDuration(0);
          clearBlobUrl();
        } catch (error) {
          console.error('Error creating voice:', error);
          toast.error('Failed to clone voice', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to process audio', {
          description: 'Could not read the audio file',
        });
        setIsUploading(false);
      };
    } catch (error) {
      console.error('Error uploading voice:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    clearBlobUrl();
    setRecordingDuration(0);
    setUploadSuccess(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isRecordingValid = recordingDuration >= 10;
  const canUpload = mediaBlobUrl && isRecordingValid && voiceName.trim() && !isUploading;

  return (
    <Card className="shadow-lg">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="voice-cloning" className="border-0">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              <span className="text-lg font-semibold">Clone Your Voice</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-6 pt-0">
        {/* Voice Name Input */}
        <div className="space-y-2">
          <Label htmlFor="voiceName">Voice Name</Label>
          <Input
            id="voiceName"
            type="text"
            placeholder="e.g., My Voice"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            disabled={status === 'recording'}
          />
        </div>

        {/* Recording Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Recording Status</p>
              <p className="text-xs text-slate-600 capitalize flex items-center gap-2">
                {status === 'recording' && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
                {status}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm font-medium">Duration</p>
              <p className={`text-2xl font-mono ${recordingDuration >= 10 ? 'text-green-600' : 'text-slate-600'}`}>
                {formatDuration(recordingDuration)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {status === 'recording' && (
            <div className="space-y-2">
              <Progress value={Math.min((recordingDuration / 10) * 100, 100)} />
              <p className="text-xs text-slate-500 text-center">
                {recordingDuration < 10 
                  ? `Record at least ${10 - recordingDuration} more seconds`
                  : 'Minimum recording length reached ✓'}
              </p>
            </div>
          )}

          {/* Validation Message */}
          {mediaBlobUrl && !isRecordingValid && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Recording is too short. Please record at least 10 seconds.
              </p>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800">
                Voice successfully cloned!
              </p>
            </div>
          )}

          {/* Recording Buttons */}
          <div className="flex gap-2">
            {status !== 'recording' && !mediaBlobUrl && (
              <Button
                onClick={handleStartRecording}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!voiceName.trim()}
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            )}

            {status === 'recording' && (
              <Button
                onClick={handleStopRecording}
                className="flex-1 bg-slate-600 hover:bg-slate-700"
              >
                Stop Recording
              </Button>
            )}

            {mediaBlobUrl && status !== 'recording' && (
              <>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  Clear & Re-record
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!canUpload}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Voice
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Audio Preview */}
        {mediaBlobUrl && (
          <div className="space-y-2">
            <Label>Preview Recording</Label>
            <audio src={mediaBlobUrl} controls className="w-full" />
          </div>
        )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

