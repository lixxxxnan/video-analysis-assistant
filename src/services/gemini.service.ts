
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Schema } from '@google/genai';

export interface NoteSegment {
  seconds: number;
  timeLabel: string;
  title: string;
  content: string;
}

export interface VideoAnalysisResult {
  title: string;
  summary: string;
  keyHighlights: string[];
  transcript: string; // Keep full raw text for copying
  noteSegments: NoteSegment[]; // For the illustrated note view
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
  }

  /**
   * Uploads a file to Gemini API and waits for it to be active.
   */
  async uploadAndAnalyzeVideo(file: File): Promise<VideoAnalysisResult> {
    try {
      // 1. Upload File
      console.log('Starting file upload for:', file.name);
      
      const uploadResponse = await this.ai.files.upload({
        file: file,
        config: { 
          displayName: file.name,
          mimeType: file.type 
        }
      });
      
      console.log('Upload response received:', uploadResponse);

      if (!uploadResponse) {
        throw new Error('Upload failed: Empty response from server.');
      }

      // Robustly get the file object. Handle cases where it's nested or direct.
      // Use optional chaining to safely access properties.
      const uploadedFile = uploadResponse.file || (uploadResponse as any);

      if (!uploadedFile) {
        throw new Error('Upload failed: Could not parse file metadata from response.');
      }

      const fileUri = uploadedFile.uri;
      const fileName = uploadedFile.name; 
      
      if (!fileUri || !fileName) {
        throw new Error(`Upload failed: Missing URI or Name in response. URI: ${fileUri}, Name: ${fileName}`);
      }

      console.log(`File uploaded successfully. URI: ${fileUri}, Name: ${fileName}`);

      // 2. Wait for processing
      await this.waitForFileActive(fileName);

      // 3. Analyze
      return await this.generateContent(fileUri, file.type);

    } catch (error) {
      console.error("Video processing workflow failed:", error);
      throw error;
    }
  }

  private async waitForFileActive(fileName: string): Promise<void> {
    console.log(`Checking status for file: ${fileName}...`);
    let file = await this.ai.files.get({ name: fileName });
    
    // Poll until active or failed
    let attempts = 0;
    while (file.state === 'PROCESSING') {
      attempts++;
      console.log(`File is still processing... (Attempt ${attempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      file = await this.ai.files.get({ name: fileName });
    }

    console.log(`File processing finished. State: ${file.state}`);

    if (file.state !== 'ACTIVE') {
      throw new Error(`Video processing failed with state: ${file.state}`);
    }
  }

  private async generateContent(fileUri: string, mimeType: string): Promise<VideoAnalysisResult> {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      你是一个专业的视频内容分析专家和小红书笔记创作者。
      请分析提供的这个视频文件。

      任务要求：
      1. **智能标题 (Smart Title)**: 生成一个吸引人的标题。
      2. **智能总结 (Summary)**: 2-3句概括核心主旨。
      3. **关键亮点 (Key Highlights)**: 3-5 个关键信息点。
      4. **图文笔记分段 (Illustrated Note Segments)**:
         - 将完整的视频内容拆分成逻辑段落。
         - 为每一段选择一个最具代表性的时间点（秒数）。
         - 每一段需要一个简短的小标题。
         - 每一段的内容要是详细的口播文稿整理，保持原意但更适合阅读。
         - **重要**：确保覆盖视频的全部主要内容。
      5. **全量口播文稿 (Full Transcript)**: 纯文本形式的完整逐字稿。
      
      请确保所有输出内容为 **简体中文**。
    `;

    // Define the schema
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        keyHighlights: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }
        },
        transcript: { type: Type.STRING },
        noteSegments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              seconds: { type: Type.NUMBER, description: "The timestamp in seconds for the screenshot of this segment" },
              timeLabel: { type: Type.STRING, description: "Formatted time string e.g. 00:15" },
              title: { type: Type.STRING, description: "Short subtitle for this segment" },
              content: { type: Type.STRING, description: "Detailed content/transcript for this segment" }
            },
            required: ["seconds", "timeLabel", "title", "content"]
          }
        }
      },
      required: ["title", "summary", "keyHighlights", "transcript", "noteSegments"]
    };

    console.log('Sending request to Gemini model...');
    const response = await this.ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            { fileData: { fileUri: fileUri, mimeType: mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    const text = response.text || '';
    console.log('Gemini response received.');
    
    try {
      const data = JSON.parse(text);
      return {
        title: data.title || '视频分析结果',
        summary: data.summary || '无法获取摘要',
        keyHighlights: data.keyHighlights || [],
        transcript: data.transcript || '',
        noteSegments: data.noteSegments || []
      };
    } catch (e) {
      console.error('Failed to parse JSON response:', text);
      throw new Error('AI 返回的数据格式有误，无法解析。');
    }
  }
}
