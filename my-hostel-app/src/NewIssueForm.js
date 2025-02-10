import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Adjust the path if needed
import './NewIssueForm.css'; // Import your CSS file

const NewIssueForm = ({ onIssuePublished }) => {
  const { user } = useAuth(); // Assuming user is obtained from AuthContext
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description) {
      setError('Please fill out both the title and description.');
      return;
    }

    setError(''); // Reset the error
    setSuccess(''); // Reset the success message

    try {
      const response = await axios.post('http://localhost:3002/issues', {
        title,
        description,
        status: 'published', // Set status to 'published' if directly publishing
        userId: user.id, // Use the logged-in user's ID
      });

      if (response.status === 201 || 204 || 200) {
        setSuccess('Issue successfully published!');
        setTitle('');
        setDescription('');
        if (onIssuePublished) {
          onIssuePublished(response.data); // Notify parent component
        }
      } else {
        setError('Failed to publish the issue. Please try again.');
      }
    } catch (error) {
      console.error('Error publishing the issue:', error);
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Raise a New Issue</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <textarea
          id="Description"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <button type="submit">Publish</button>
    </form>
  );
};

export default NewIssueForm;
