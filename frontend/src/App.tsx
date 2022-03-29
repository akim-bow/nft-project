import React, { useState } from 'react';
import Layout from "./Layout";
import Button from "@mui/material/Button";
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

function App() {
  const [formData, setFormData] = useState({"snakeId": "", "patternId": "", "attrId": "", "schemaId": ""});
  const [imageUrl, setImageUrl] = useState("");

  const fetchSnake = (event: React.FormEvent) => {
    event.preventDefault();

    axios.post("/api/snakes/mint", formData).then(res => {
        setImageUrl(res.data.data.url);
    }).catch(console.log);
  }

  const formInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.getAttribute('name') as string;
    setFormData({ ...formData, [name]: event.target.value });
  }

  return (
    <Layout>
      <Box component="form" onSubmit={fetchSnake} sx={{mb: 2}}>
        <TextField id="snake-id" name="snakeId" required label="Snake id" onChange={formInputHandler} variant="standard" margin="normal" />
        <TextField id="pattern-id" name="patternId" label="Pattern id" onChange={formInputHandler} variant="standard" margin="normal" />
        <TextField id="attr-id" name="attrId" label="Attr id" onChange={formInputHandler} variant="standard" margin="normal" />
        <TextField id="scheme-id" name="schemaId" label="Color scheme id" onChange={formInputHandler} variant="standard" margin="normal" />
        <Button type="submit" >Сминтить картинку</Button>
      </Box>
      {
        imageUrl && (
          <Box>
            <img width="96" height="96" src={imageUrl} alt={"snake"}/>
          </Box>
        )
      }

    </Layout>
  );
}

export default App;
