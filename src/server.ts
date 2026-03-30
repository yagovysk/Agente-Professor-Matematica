import "dotenv/config";
import { createApp } from "./app";
import { OllamaTeacherService } from "./services/aiTeacher";

const port = Number(process.env.PORT ?? 3000);
const teacherService = new OllamaTeacherService(
  process.env.OLLAMA_BASE_URL,
  process.env.OLLAMA_MODEL,
);
const app = createApp(teacherService);

app.listen(port, () => {
  console.log(`Professor de matematica online em http://localhost:${port}`);
});
