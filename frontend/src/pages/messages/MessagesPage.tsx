import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/chat');
  }, []);

  return null;
};