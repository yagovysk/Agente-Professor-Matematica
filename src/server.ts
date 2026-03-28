import "dotenv/config";
import { createApp } from "./app";
import { OpenAITeacherService } from "./services/aiTeacher";

const port = Number(process.env.PORT ?? 3000);
const teacherService = new OpenAITeacherService(process.env.OPENAI_API_KEY);
const app = createApp(teacherService);

app.listen(port, () => {
  console.log(`Professor de matematica online em http://localhost:${port}`);
});
