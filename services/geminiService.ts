
import { DifyModelConfig } from "../types";

// 硬编码 API Key
const DIFY_API_KEY = "app-j7S5ZdVDtDlmPI1sfIdErmo9";

/**
 * 深度解析内容，确保返回的一定是字符串
 */
const extractContent = (data: any): string => {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
        return data.map(item => extractContent(item)).join("");
    }
    if (data && typeof data === 'object') {
        return data.content || data.answer || data.text || "";
    }
    return String(data || "");
};

/**
 * 发送消息到 Dify API
 * 关键策略：永远不发送外部 conversation_id，只通过 inputs 传递业务会话 ID
 */
export const chatWithBot = async (
  config: DifyModelConfig,
  query: string,
  userId: string,
  innerId?: string
): Promise<{ text: string; innerId: string }> => {
  try {
    const payload = {
      inputs: {
        access_key_id: config.clinkAk,
        access_key_secret: config.clinkSk,
        agent_id: config.agentId,
        user_id: userId,
        // 将业务会话 ID 传给工作流变量，这是维持上下文的唯一钥匙
        conversation_id: innerId || ""
      },
      query: query,
      response_mode: "blocking",
      // 关键修正：永远传空字符串。
      // 如果传了旧的外部 ID， Dify 可能会锁定 inputs 导致内部 ID 无法生效。
      conversation_id: "", 
      user: userId,
      files: []
    };

    const response = await fetch("https://ai-agent.tinetcloud.com/v1/chat-messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 错误: ${response.status} ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    let textResponse = "";
    let extractedInnerId = "";

    // 从 answer 字段中解析 JSON，获取业务正文和业务会话 ID
    if (data.answer !== undefined && data.answer !== null) {
        if (typeof data.answer === 'string') {
            const trimmed = data.answer.trim();
            // 尝试解析 JSON
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    const parsed = JSON.parse(trimmed);
                    
                    // 1. 提取内部业务 ID (通常在解析后的 JSON 根部)
                    if (parsed.conversation_id) {
                        extractedInnerId = parsed.conversation_id;
                    }

                    // 2. 提取文本内容 (根据日志，可能是 parsed.answer 数组)
                    if (parsed.answer && Array.isArray(parsed.answer)) {
                        textResponse = parsed.answer.map((item: any) => item.content || "").join("");
                    } else {
                        textResponse = extractContent(parsed);
                    }
                } catch (e) {
                    textResponse = trimmed;
                }
            } else {
                textResponse = trimmed;
            }
        } else {
            textResponse = extractContent(data.answer);
            if (data.answer.conversation_id) extractedInnerId = data.answer.conversation_id;
        }
    }

    // 兜底文本
    if (!textResponse && data.metadata?.message) textResponse = String(data.metadata.message);
    if (!textResponse && data.message) textResponse = String(data.message);
    
    // 如果内部没返回 ID，则维持当前的 ID
    const finalInnerId = extractedInnerId || innerId || "";

    return {
      text: textResponse || "智能体未返回有效内容。",
      innerId: finalInnerId
    };

  } catch (error: any) {
    throw error;
  }
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    const clean = firstMessage.trim().replace(/\n/g, ' ');
    return Promise.resolve(clean.slice(0, 15) + (clean.length > 15 ? '...' : ''));
}
