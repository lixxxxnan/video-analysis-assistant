import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-4">
      <label class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        上传视频文件
      </label>
      
      <!-- Drag & Drop Zone -->
      <div 
        class="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer group"
        [class.border-blue-500]="isDragging()"
        [class.bg-blue-50]="isDragging()"
        [class.border-gray-300]="!isDragging()"
        [class.bg-gray-50]="!isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input 
          #fileInput 
          type="file" 
          accept="video/*" 
          class="hidden" 
          (change)="onFileSelected($event)"
        >

        @if (!selectedFile()) {
          <div class="space-y-3 pointer-events-none">
            <div class="mx-auto w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p class="text-base font-medium text-gray-700">点击或拖拽视频到此处</p>
              <p class="text-xs text-gray-400 mt-1">支持 MP4, MOV, WEBM 等 (最大 1GB)</p>
            </div>
          </div>
        } @else {
          <div class="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100 pointer-events-none">
            <div class="flex items-center gap-3 overflow-hidden">
               <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
               </div>
               <div class="text-left truncate">
                 <p class="text-sm font-medium text-gray-900 truncate">{{ selectedFile()?.name }}</p>
                 <p class="text-xs text-gray-500">{{ formatSize(selectedFile()?.size || 0) }}</p>
               </div>
            </div>
            <button 
              (click)="$event.stopPropagation(); removeFile()"
              class="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors pointer-events-auto"
              [disabled]="isLoading()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        }
      </div>

      <button
        (click)="submit()"
        [disabled]="!selectedFile() || isLoading()"
        class="w-full flex items-center justify-center py-3 px-6 rounded-xl text-white font-semibold text-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none disabled:transform-none bg-blue-600 hover:bg-blue-700"
      >
        @if (isLoading()) {
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="truncate">{{ loadingText() || '正在处理...' }}</span>
        } @else {
          开始分析视频
        }
      </button>
      
      @if (error()) {
        <p class="text-xs text-red-500 text-center">{{ error() }}</p>
      }
    </div>
  `
})
export class AnalysisFormComponent {
  isLoading = input<boolean>(false);
  loadingText = input<string>('');
  analyze = output<File>();
  
  selectedFile = signal<File | null>(null);
  isDragging = signal<boolean>(false);
  error = signal<string | null>(null);

  readonly MAX_SIZE = 1024 * 1024 * 1024; // 1GB

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  validateAndSetFile(file: File) {
    this.error.set(null);
    
    if (!file.type.startsWith('video/')) {
      this.error.set('请选择有效的视频文件');
      return;
    }

    if (file.size > this.MAX_SIZE) {
      this.error.set('文件大小超过 1GB 限制');
      return;
    }

    this.selectedFile.set(file);
  }

  removeFile() {
    this.selectedFile.set(null);
    this.error.set(null);
  }

  submit() {
    const file = this.selectedFile();
    if (file) {
      this.analyze.emit(file);
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}