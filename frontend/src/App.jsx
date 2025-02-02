import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get('/api/images?limit=20&random=true');
      if (response.data.length === 0) {
        setMessage('Brak zdjęć w galerii. Dodaj nowe zdjęcie!');
      } else {
        setMessage('');
      }
      setImages(response.data);
    } catch (err) {
      setError('Błąd podczas pobierania zdjęć.');
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post('/api/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newImage = response.data;

      setImages((prevImages) => {
        const updatedImages = [newImage, ...prevImages];
        if (updatedImages.length > 20) {
          updatedImages.pop();
        }
        return updatedImages;
      });
      setSelectedFile(null);
      setMessage('');
    } catch (err) {
      setError('Błąd podczas wgrywania zdjęcia.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/images/${id}`);
      setImages((prevImages) => {
        const updated = prevImages.filter((img) => img.id !== id);
        if (updated.length === 0) {
          setMessage('Brak zdjęć w galerii. Dodaj nowe zdjęcie!');
        }
        return updated;
      });
    } catch (err) {
      setError('Błąd podczas usuwania zdjęcia.');
      console.error(err);
    }
  };

  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1>Galeria zdjęć</h1>
	  <h2>Strona losuje do 20 losowych zdjęć z bazy</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p>{message}</p>}
      
      <div style={{ marginBottom: '20px' }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
          Wgraj nowe zdjęcie
        </button>
      </div>

      {images.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {images.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                border: '1px solid #ccc',
                padding: '5px',
              }}
            >
              <img
                src={image.url}
                alt="Zdjęcie galerii"
                style={{ width: '200px', height: 'auto', display: 'block' }}
              />
              <button
                onClick={() => handleDelete(image.id)}
                style={{
                  position: 'absolute',
                  top: '3px',
                  right: '5px',
                  color: 'red',
				  background: 'none',
				  border: 'none',
                  cursor: 'pointer',
				  fontSize: '18px'
                }}
                title="Usuń zdjęcie"
              >X</button>
            </div>
          ))}
        </div>
      ) : (
        <p>Brak zdjęć w galerii. Dodaj nowe zdjęcie!</p>
      )}
    </div>
  );
}

export default App;
