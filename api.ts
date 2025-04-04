import { AIModel, AICategory, TrendData, APIResponse } from "@/types/api";
import { MessageSquare, Image, Code2, FileText, Database } from "lucide-react";

class API {
  private userSubscriptions: string[] = [];
  private readonly MIN_CALL_STACK_SIZE = 15;

  async fetchHuggingFaceModels(): Promise<APIResponse<AIModel[]>> {
    try {
      const response = await fetch("https://huggingface.co/api/models");
      const data = await response.json();
      
      const models: AIModel[] = data.map((model: any) => ({
        id: model.id,
        name: model.modelId,
        description: model.pipeline_tag || "No description available",
        source: "HuggingFace",
        sourceUrl: `https://huggingface.co/${model.id}`,
        category: model.pipeline_tag || "Other",
        categoryColor: "bg-aiblue-dark",
        tags: model.tags || [],
        stars: model.likes || 0,
        date: "Recently",
        createdAt: new Date().toISOString(),
        isSubscribed: this.userSubscriptions.includes(model.id),
      }));

      return { data: models, error: null };
    } catch (error) {
      return { data: [], error: "Failed to fetch Hugging Face models" };
    }
  }

  async fetchGitHubModels(): Promise<APIResponse<AIModel[]>> {
    try {
      const response = await fetch("https://api.github.com/search/repositories?q=AI+model&sort=stars&order=desc");
      const data = await response.json();
      
      const models: AIModel[] = data.items.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        description: repo.description || "No description available",
        source: "GitHub",
        sourceUrl: repo.html_url,
        category: "Code Models",
        categoryColor: "bg-aiorange-dark",
        tags: ["code-generation", "open-source"],
        stars: repo.stargazers_count,
        date: "Recently",
        createdAt: repo.created_at,
        isSubscribed: this.userSubscriptions.includes(repo.id.toString()),
      }));

      return { data: models, error: null };
    } catch (error) {
      return { data: [], error: "Failed to fetch GitHub models" };
    }
  }

  async fetchArxivModels(): Promise<APIResponse<AIModel[]>> {
    try {
      const response = await fetch("http://export.arxiv.org/api/query?search_query=cat:cs.AI&max_results=10");
      const text = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const entries = xmlDoc.getElementsByTagName("entry");
      
      const models: AIModel[] = Array.from(entries).map((entry) => {
        const title = entry.getElementsByTagName("title")[0].textContent || "Unknown";
        const link = entry.getElementsByTagName("id")[0].textContent || "#";

        return {
          id: link,
          name: title,
          description: "AI research paper on ArXiv",
          source: "ArXiv",
          sourceUrl: link,
          category: "Research",
          categoryColor: "bg-aiteal-dark",
          tags: ["AI", "research"],
          stars: 0,
          date: "Recently",
          createdAt: new Date().toISOString(),
          isSubscribed: this.userSubscriptions.includes(link),
        };
      });

      return { data: models, error: null };
    } catch (error) {
      return { data: [], error: "Failed to fetch ArXiv models" };
    }
  }

  async getAllModels(): Promise<APIResponse<AIModel[]>> {
    const hfModels = await this.fetchHuggingFaceModels();
    const ghModels = await this.fetchGitHubModels();
    const arxivModels = await this.fetchArxivModels();

    return {
      data: [...hfModels.data, ...ghModels.data, ...arxivModels.data],
      error: hfModels.error || ghModels.error || arxivModels.error,
    };
  }

  async getTrendData(): Promise<APIResponse<TrendData[]>> {
    const data: TrendData[] = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const models = Math.floor(Math.random() * 50) + 10;
      data.push({ date: date.toISOString().split('T')[0], models });
    }
    
    return { data, error: null };
  }

  async getModelsByCategory(category: string): Promise<APIResponse<AIModel[]>> {
    const allModels = await this.getAllModels();
    return { data: allModels.data.filter(m => m.category === category), error: null };
  }

  async getModelsBySource(source: string): Promise<APIResponse<AIModel[]>> {
    const allModels = await this.getAllModels();
    return { data: allModels.data.filter(m => m.source === source), error: null };
  }

  async searchModels(query: string): Promise<APIResponse<AIModel[]>> {
    const allModels = await this.getAllModels();
    return { data: allModels.data.filter(m => m.name.includes(query) || m.description.includes(query)), error: null };
  }

  async getLatestModels(): Promise<APIResponse<AIModel[]>> {
    const allModels = await this.getAllModels();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return { data: allModels.data.filter(m => new Date(m.createdAt) >= oneWeekAgo), error: null };
  }

  async getAllCategories(): Promise<APIResponse<string[]>> {
    const allModels = await this.getAllModels();
    const categories = [...new Set(allModels.data.map(m => m.category))];
    return { data: categories, error: null };
  }

  async getCategories(): Promise<APIResponse<AICategory[]>> {
    const categoriesResponse = await this.getAllCategories();
    return { 
      data: categoriesResponse.data.map((c, index) => ({ 
        id: index.toString(), 
        title: c, 
        count: 0, 
        growth: 0, 
        color: "bg-default" 
      })), 
      error: categoriesResponse.error 
    };
  }
}

export const api = new API();
