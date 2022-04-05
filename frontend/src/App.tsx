import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import Button from "@mui/material/Button";
import axios from "axios";
import Box from "@mui/material/Box";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select/SelectInput";
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';

interface SnakeAsset {
  id: string;
  attrs: string[];
  schemas: string[];
}

interface SnakeAssets {
  arenas: string[],
  patterns: string[];
  snakes: SnakeAsset[];
}

interface FormSelectProps {
  id: string;
  name: string;
  required: boolean;
  selectItems: string[];
  onChange: (e: SelectChangeEvent) => void;
  value: string;
  sx?: SxProps<Theme>,
}

function FormSelect({
  id,
  name,
  required,
  selectItems,
  value,
  onChange,
  sx,
}: FormSelectProps) {
  return (
    <FormControl fullWidth required={required} sx={sx}>
      <InputLabel id={id + "-label"}>{name}</InputLabel>
      <Select labelId={id + "-label"} id={id} name={name} onChange={onChange} value={value}>
        {selectItems.map((selectItem, index) => (
          <MenuItem value={selectItem} key={index}>
            {selectItem}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function App() {
  const [formData, setFormData] = useState({
    arenaId: "",
    snakeId: "",
    patternId: "",
    attrId: "",
    schemaId: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [snakeAssets, setSnakesAssets] = useState<SnakeAssets>({
    arenas: [],
    snakes: [],
    patterns: [],
  });

  useEffect(() => {
    axios
      .get("/api/snakes/assets")
      .then((res) => {
        setSnakesAssets(res.data.data);
      })
      .catch(console.log);
  }, []);

  const fetchSnake = (event: React.FormEvent) => {
    event.preventDefault();

    axios
      .post("/api/snakes/mint", formData)
      .then((res) => {
        setImageUrl(res.data.data.url);
      })
      .catch(console.log);
  };

  const formInputHandler = (event: SelectChangeEvent) => {
    const name = event.target.name;
    setFormData({ ...formData, [name]: event.target.value });
  };

  const selectedSnake = snakeAssets.snakes.find(
    (snake) => snake.id === formData.snakeId
  );

  return (
    <Layout>
      <Box component="form" onSubmit={fetchSnake} sx={{ mb: 2 }}>
        <FormSelect
          id="arena-id"
          name="arenaId"
          required={false}
          selectItems={snakeAssets.arenas}
          value={formData.arenaId}
          onChange={formInputHandler}
          sx={{mb: 2}}
        />
        <FormSelect
          id="snake-id"
          name="snakeId"
          required={false}
          selectItems={snakeAssets.snakes.map((asset) => asset.id)}
          value={formData.snakeId}
          onChange={formInputHandler}
          sx={{mb: 2}}
        />
        <FormSelect
          id="pattern-id"
          name="patternId"
          required={false}
          selectItems={snakeAssets.patterns}
          value={formData.patternId}
          onChange={formInputHandler}
          sx={{mb: 2}}
        />
        <FormSelect
          id="attr-id"
          name="attrId"
          required={false}
          selectItems={selectedSnake ? selectedSnake.attrs : []}
          value={formData.attrId}
          onChange={formInputHandler}
          sx={{mb: 2}}
        />
        <FormSelect
          id="scheme-id"
          name="schemaId"
          required={false}
          selectItems={selectedSnake ? selectedSnake.schemas : []}
          value={formData.schemaId}
          onChange={formInputHandler}
          sx={{mb: 2}}
        />

        <Button type="submit">Сминтить картинку</Button>
      </Box>
      {imageUrl && (
        <Box>
          <img src={imageUrl} alt={"snake"} />
        </Box>
      )}
    </Layout>
  );
}

export default App;
