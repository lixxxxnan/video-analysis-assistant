
import { Component, input, signal, effect, untracked } from '@angular/core';
import { VideoAnalysisResult, NoteSegment } from '../services/gemini.service';

@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
      
      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="fixed top-24 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-[pulse_0.2s_ease-out]">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-green-400">
            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-medium">复制成功</span>
        </div>
      }

      <!-- Title Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <h2 class="text-2xl font-bold leading-tight mb-2">{{ data().title }}</h2>
        <div class="flex items-center gap-2 opacity-90 text-sm">
          <span class="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">AI 分析结果</span>
        </div>
      </div>

      <div class="p-6 space-y-8">
        
        <!-- AI Summary -->
        <section>
          <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
            视频内容概览
          </h3>
          <div class="bg-white p-5 rounded-xl border border-gray-200 text-gray-800 leading-relaxed text-base shadow-sm">
            {{ data().summary }}
          </div>
        </section>

        <!-- Key Highlights -->
        @if (data().keyHighlights.length > 0) {
          <section>
             <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              关键亮点
            </h3>
            <div class="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <ul class="space-y-3">
                @for (point of data().keyHighlights; track $index) {
                  <li class="flex items-start gap-3">
                    <span class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0 mt-0.5">{{ $index + 1 }}</span>
                    <span class="text-gray-800 font-medium">{{ point }}</span>
                  </li>
                }
              </ul>
            </div>
          </section>
        }

        <!-- Illustrated Note Segments -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              图文笔记
            </h3>
             <button class="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 group bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100" (click)="copyText(data().transcript)">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 group-active:scale-90 transition-transform">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H17.25a1.125 1.125 0 01-1.125 1.125v3.375m-3.88 14.857l-5.26-5.26m0 0l5.26-5.26m-5.26 5.26h14.25" />
               </svg>
               复制全文
             </button>
          </div>
          
          <div class="space-y-6">
            @for (segment of data().noteSegments; track $index) {
              <div class="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div class="flex flex-col md:flex-row">
                  <!-- Screenshot Area -->
                  <div class="md:w-1/3 h-48 md:h-auto bg-gray-100 relative shrink-0">
                    @if (screenshots().get($index)) {
                      <img [src]="screenshots().get($index)" class="w-full h-full object-cover" alt="Video frame at {{segment.timeLabel}}">
                      <div class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {{ segment.timeLabel }}
                      </div>
                    } @else {
                       <div class="w-full h-full flex items-center justify-center text-gray-400">
                          <svg class="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                       </div>
                    }
                  </div>
                  <!-- Content Area -->
                  <div class="p-5 md:w-2/3 flex flex-col justify-center">
                    <h4 class="font-bold text-gray-900 mb-2">{{ segment.title }}</h4>
                    <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{{ segment.content }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </section>

      </div>
    </div>
  `
})
export class ResultCardComponent {
  data = input.required<VideoAnalysisResult>();
  videoFile = input<File | null>(null);
  showToast = signal(false);
  screenshots = signal<Map<number, string>>(new Map());

  constructor() {
    effect(() => {
      const file = this.videoFile();
      const segments = this.data().noteSegments;
      if (file && segments && segments.length > 0) {
        // Need to untrack to prevent infinite loops if something weird happens, 
        // though strictly not needed here as we don't read signals inside the async operation in a reactive way.
        untracked(() => {
          this.generateScreenshots(file, segments);
        });
      }
    });
  }

  async generateScreenshots(file: File, segments: NoteSegment[]) {
    // 1. Create a video element
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous'; // Not strictly needed for blob, but good practice

    // Wait for metadata to load to ensure seeking works
    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(true);
      video.load();
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set map
    const newMap = new Map<number, string>();

    // Process sequentially to avoid seeking conflicts
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const time = segment.seconds;

      try {
        video.currentTime = time;
        await new Promise((resolve) => {
           // Wait for seeked event
           const onSeeked = () => {
             video.removeEventListener('seeked', onSeeked);
             resolve(true);
           };
           video.addEventListener('seeked', onSeeked);
        });

        // Set canvas size to match video natural size (or scaled down for performance)
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        newMap.set(i, dataUrl);
        
        // Update signal progressively so images pop in
        this.screenshots.update(m => new Map(m).set(i, dataUrl));
        
      } catch (err) {
        console.error(`Failed to capture frame at ${time}s`, err);
      }
    }

    // Cleanup
    URL.revokeObjectURL(video.src);
    video.remove();
    canvas.remove();
  }

  copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast.set(true);
      setTimeout(() => {
        this.showToast.set(false);
      }, 2000);
    }).catch(err => console.error('Failed to copy text', err));
  }
}
