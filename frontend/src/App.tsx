import React, { useEffect, useState } from 'react';
import Layout from "./Layout";
import Button from "@mui/material/Button";
import axios from 'axios';

function App() {
  const fetchSnake = () => {
    axios.post("/api/snakes/mint", {
      "snakeId": "aaaaaaaa",
      "patternId": "pattern_001",
      "attrId": "element_002",
    }).then(res => {
        window.open(res.data.data.url);
    }).catch(console.log);
  }

  return (
    <Layout>
      <Button onClick={fetchSnake}>Сминтить картинку</Button>
    </Layout>
  );
}

export default App;
