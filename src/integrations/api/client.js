var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
class APIClient {
  constructor() {
    __publicField(this, "token", localStorage.getItem("auth_token"));
  }
  getHeaders() {
    return {
      "Content-Type": "application/json",
      ...this.token && { Authorization: `Bearer ${this.token}` }
    };
  }
  setToken(token) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }
  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }
  async request(method, endpoint, body) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders(),
      credentials: "include"
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText
      }));
      
      // Handle validation errors
      if (error.errors && Array.isArray(error.errors)) {
        const messages = error.errors.map(err => err.msg || err.message).join(', ');
        throw new Error(messages || 'Validation failed');
      }
      
      throw new Error(error.error || error.message || "API request failed");
    }
    return response.json();
  }
  // Auth endpoints
  async signup(email, password, name, role) {
    const data = await this.request("POST", "/auth/signup", {
      email,
      password,
      name,
      role
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }
  async signin(email, password) {
    const data = await this.request("POST", "/auth/signin", {
      email,
      password
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }
  async getMe() {
    return this.request("GET", "/auth/me");
  }
  // Profile endpoints
  async updateProfile(userId, name) {
    return this.request("PUT", `/profiles/${userId}`, { name });
  }
  async getProfile(userId) {
    return this.request("GET", `/profiles/${userId}`);
  }
  async getBatchProfiles(ids) {
    return this.request("POST", "/profiles/batch", { ids });
  }
  // Quiz endpoints
  async createQuiz(title, topic, difficulty, timeLimit) {
    return this.request("POST", "/quizzes", {
      title,
      topic,
      difficulty,
      timeLimit
    });
  }
  async getMyQuizzes() {
    return this.request("GET", "/quizzes/my-quizzes");
  }
  async getQuizByCode(code) {
    return this.request("GET", `/quizzes/code/${code}`);
  }
  async getQuiz(id) {
    return this.request("GET", `/quizzes/${id}`);
  }
  async updateQuiz(id, updates) {
    return this.request("PUT", `/quizzes/${id}`, updates);
  }
  async deleteQuiz(id) {
    return this.request("DELETE", `/quizzes/${id}`);
  }
  // Questions endpoints
  async addQuestions(quizId, questions) {
    return this.request("POST", "/questions", {
      quizId,
      questions
    });
  }
  async getQuestions(quizId) {
    return this.request("GET", `/questions/quiz/${quizId}`);
  }
  async deleteQuestion(id) {
    return this.request("DELETE", `/questions/${id}`);
  }
  // Attempts endpoints
  async submitAttempt(quizId, answers) {
    return this.request("POST", "/attempts", {
      quizId,
      answers
    });
  }
  async getAttempts() {
    return this.request("GET", "/attempts");
  }
  async getAttempt(id) {
    return this.request("GET", `/attempts/${id}`);
  }
  async getLeaderboard(quizCode) {
    return this.request("GET", `/attempts/quiz/${quizCode}/leaderboard`);
  }
  // AI endpoints
  async generateQuiz(prompt, topic, difficulty, count) {
    return this.request("POST", "/ai/generate-quiz", {
      prompt,
      topic,
      difficulty,
      count
    });
  }
}
const apiClient = new APIClient();
export {
  APIClient,
  apiClient
};
