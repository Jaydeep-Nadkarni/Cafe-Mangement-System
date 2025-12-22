import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the server
    // Use environment variable for URL if available, otherwise default to localhost
    const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const newSocket = io(SERVER_URL, {
      withCredentials: true,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });
    
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinBranchRoom = (branchId) => {
    if (socket && branchId) {
      socket.emit('joinBranch', branchId);
    }
  };

  const leaveBranchRoom = (branchId) => {
    if (socket && branchId) {
      socket.emit('leaveBranch', branchId);
    }
  };

  const value = {
    socket,
    isConnected,
    joinBranchRoom,
    leaveBranchRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
