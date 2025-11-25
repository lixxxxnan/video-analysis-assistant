
import { Component, signal } from '@angular/core';
import { GeminiService, VideoAnalysisResult } from './services/gemini.service';
import { AnalysisFormComponent } from './components/analysis-form.component';
import { ResultCardComponent } from './components/result-display.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AnalysisFormComponent, ResultCardComponent],
  templateUrl: './app.component.html',
  changeDetection: 1 // OnPush
})
export class AppComponent {
  isLoading = signal<boolean>(false);
  loadingText = signal<string>('');
  result = signal<VideoAnalysisResult | null>(null);
  error = signal<string | null>(null);
  currentFile = signal<File | null>(null);

  constructor(private geminiService: GeminiService) {}

  async onAnalyze(file: File) {
    this.isLoading.set(true);
    this.loadingText.set('正在上传并分析视频，这可能需要一两分钟...');
    this.error.set(null);
    this.result.set(null);
    this.currentFile.set(file);

    try {
      const data = await this.geminiService.uploadAndAnalyzeVideo(file);
      this.result.set(data);
    } catch (err: any) {
      console.error('Analysis failed', err);
      // Extract a user-friendly message
      let msg = err.message || '视频分析失败，请重试。';
      if (msg.includes('uri')) msg = '文件上传响应异常，请刷新重试。';
      this.error.set(msg);
    } finally {
      this.isLoading.set(false);
      this.loadingText.set('');
    }
  }
}
