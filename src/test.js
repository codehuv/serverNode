import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { default as FormData } from "form-data";

// Initialize Express app
const app = express();
const port = 9000;

// 파일 디렉토리 찾기
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename);
// const __dirname = "/Users/igyuseong/Desktop/pythonFlask"
//-------------------------------------------------------------------------------------------------

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// 현재 로컬 환경 테스트로 uploads 폴더에 업로드 기능을 구현했지만 추후 s3저장소를 의미합니다.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
// Routes[Upload], 다음의 코드는 s3를 로컬환경으로 대체해 진행함.
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    // 플라스크로 보낼 정보 formData에 저장 후 전송
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path));
    formData.append('metadata', JSON.stringify(metadata));
    const flaskResponse = await axios.post('http://3.80.103.72:8000/labeling', formData, {
      headers :{...formData.getHeaders() ,'Content-Type': 'multipart/form-data'}
    });

    res.status(200).send('File uploaded to Flask server successfully');
    setTimeout(() => {// async, await()
        // Send the Flask server's response back to the client
        console.log('Response from Flask server:', flaskResponse.data);
      }, 10000);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading file');
  } finally {
    // 업로드받은 파일 node server 폴더 내 업로드파일 복사본 삭제
    const file = req.file;
    fs.unlink(file.path, (err) => {
      if (err) console.error(err);
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
