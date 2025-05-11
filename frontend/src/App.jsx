import { useState, useEffect, useRef,useCallback,useMemo,memo } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useParams,
  useNavigate,
  Link
} from "react-router-dom";
import { io } from "socket.io-client";
import { 
  MessageSquare, 
  ArrowUp, 
  Scale, 
  BookOpen, 
  UserCircle, 
  Trash2, 
  PanelRight, 
  Paperclip, 
  X, 
  Send, 
  Clock, 
  BookText, 
  CheckCircle, 
  Copy, 
  Share2,
  ChevronRight,
  Search,
  FileText,
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

// Initialize socket connection with error handling
const socket = io("chatgpttroll-production-2cfd.up.railway.app", {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

// Better socket event logging
socket.on("connect", () => {
  console.log("✅ Connected to Socket.IO server:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error);
  toast.error("Connection error. Please check your internet connection.");
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Disconnected from Socket.IO server:", reason);
  if (reason === "io server disconnect") {
    // The server has forcefully disconnected the socket
    socket.connect();
  }
});

// Colors and styling constants
const THEME = {
  primary: {
    navy: "#1a365d",
    lightNavy: "#2a4365",
    gold: "#e6b618",
    burgundy: "#800020",
    darkBurgundy: "#580016",
    parchment: "#f9f5e7",
    offWhite: "#f8f9fa",
    border: "#e2e8f0",
  },
  typography: {
    heading: "font-serif font-semibold",
    body: "font-sans",
  },
  shadow: "shadow-md hover:shadow-lg transition-shadow duration-300",
};

// Helper functions
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit'
  });
};

const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Reusable Button component
const Button = ({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "md", 
  className = "", 
  icon = null 
}) => {
  const baseStyle = "rounded-lg flex items-center justify-center gap-2 transition-all duration-200";
  
  const variants = {
    primary: "bg-legal-burgundy text-legal-gold hover:bg-legal-darkburgundy",
    secondary: "bg-legal-lightnavy text-white hover:bg-legal-navy",
    outline: "border border-legal-burgundy text-legal-burgundy hover:bg-legal-burgundy/10",
    ghost: "text-legal-navy hover:bg-legal-navy/10",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  
  const sizes = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
    icon: "p-2",
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && icon}
      {children}
    </motion.button>
  );
};

// Toast notifications with better styling
const showToast = {
  success: (message) => {
    toast.success(message, {
      style: {
        background: "#f0fff4",
        color: "#2f855a",
        border: "1px solid #9ae6b4",
      },
      duration: 3000,
    });
  },
  error: (message) => {
    toast.error(message, {
      style: {
        background: "#fff5f5",
        color: "#c53030",
        border: "1px solid #feb2b2",
      },
      duration: 4000,
    });
  },
  info: (message) => {
    toast(message, {
      icon: "ℹ️",
      style: {
        background: "#ebf8ff",
        color: "#2c5282",
        border: "1px solid #bee3f8",
      },
    });
  },
};

// Chat bubble component for cleaner JSX
const ChatBubble = ({ message }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isResponder = message.role === "responder";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isResponder ? "justify-start" : "justify-end"} mb-6`}
    >
<div className={`max-w-3xl p-4 rounded-xl ${
  isResponder
    ? "bg-slate-800 text-white border-l-4 border-yellow-500"
    : "bg-gray-50 border-r-4 border-slate-600"
}`}>
  <div className="flex items-start gap-3">
    {isResponder && (
      <Scale className="w-6 h-6 mt-1 text-yellow-500 flex-shrink-0" />
    )}
    <div className="flex-1 overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium flex items-center">
          {isResponder ? "LegalAI Counsel" : "Client"}
          {isResponder && (
            <span className="ml-2 text-xs bg-yellow-500 text-slate-900 px-2 py-0.5 rounded-full">Official</span>
          )}
        </p>
        {message.timestamp && (
          <span className="text-xs opacity-70">
            {formatTimestamp(message.timestamp)}
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-base leading-relaxed whitespace-pre-wrap break-words overflow-auto max-h-96">
          {message.message}
        </p>
        <button
          onClick={() => copyToClipboard(message.message)}
          className={`absolute top-0 right-0 p-1 rounded-full opacity-0 hover:opacity-100 focus:opacity-100 bg-opacity-20 hover:bg-opacity-30 ${
            isResponder ? "bg-white text-white" : "bg-slate-600 text-slate-600"
          }`}
          title="Copy text"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      {message.image && (
        <img
          src={message.image}
          alt="Case document"
          className="mt-3 rounded-lg border border-gray-300 max-w-xs hover:opacity-90 transition-opacity cursor-pointer"
          onClick={() => window.open(message.image, '_blank')}
        />
      )}
      {message.citations && (
        <div className={`mt-3 text-xs opacity-80 border-t ${isResponder ? "border-slate-700" : "border-gray-300"} pt-2`}>
          <p className="font-medium mb-1 flex items-center">
            <span>Citations</span>
            <span className="ml-2 bg-slate-700 text-xs text-white px-1.5 py-0.5 rounded">Legal</span>
          </p>
          <ul className="list-disc list-inside">
            {message.citations.map((citation, idx) => (
              <li key={idx} className="truncate hover:text-clip hover:overflow-visible">{citation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
</div>
    </motion.div>
  );
};

// Improved Chat component
const Chat = () => {
  const { roomId } = useParams();
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caseInfo, setCaseInfo] = useState(null);
  const [showKnowledgePanel, setShowKnowledgePanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [legalResources, setLegalResources] = useState([]);
  const [userThinking, setUserThinking] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const navigate = useNavigate();

  // Mock legal database information
  const mockLegalResources = [
    { id: 1, title: "Contract Law Basics", category: "Contract Law", preview: "Understanding the fundamentals of contract formation, consideration, and enforcement." },
    { id: 2, title: "Landlord-Tenant Rights", category: "Property Law", preview: "Overview of legal obligations between landlords and tenants." },
    { id: 3, title: "Small Claims Court Procedures", category: "Civil Procedure", preview: "Step-by-step guide to small claims filings and hearings." },
    { id: 4, title: "Intellectual Property Protections", category: "IP Law", preview: "Copyright, trademark, and patent information for creators and businesses." },
    { id: 5, title: "Family Law Statutes", category: "Family Law", preview: "Legal frameworks for divorce, custody, and support obligations." }
  ];

  // Detect scroll position to manage auto-scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Smooth scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "end"
      });
    }
  }, [chat, autoScroll]);

  // Content-based resource recommendations
  useEffect(() => {
    if (chat.length > 0) {
      // Get the most recent client message
      const clientMessages = chat
        .filter(msg => msg.role !== "responder")
        .slice(-3)
        .map(msg => msg.message);
      
      if (clientMessages.length === 0) return;
      
      const lastMessageContent = clientMessages.join(" ").toLowerCase();
      
      // Match resources to content
      const matchedResources = mockLegalResources.filter(resource => {
        const keywords = [
          resource.title.toLowerCase(), 
          resource.category.toLowerCase(),
          resource.preview.toLowerCase()
        ];
        
        return keywords.some(keyword => lastMessageContent.includes(keyword));
      });
      
      // Always show some resources with relevant ones first
      const relevantResources = matchedResources.length > 0 
        ? matchedResources 
        : mockLegalResources.slice(0, 3);
      
      setLegalResources(relevantResources);
    }
  }, [chat]);

  // Socket.io event handling with improved flow
  useEffect(() => {
    // Show loading state immediately
    setIsLoading(true);
    
    // Create a clean connection and join room
    socket.emit("joinRoom", roomId);
    socket.emit("getMessages", roomId);
    socket.emit("userJoined", { roomId });
    
    // Fetch mock case info with more realistic details
    const caseNumber = roomId.slice(-8).toUpperCase();
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
    
    setCaseInfo({
      caseNumber,
      status: "Active",
      created: randomDate.toLocaleDateString(),
      category: "Legal Consultation",
      assignedTo: "AI Legal Assistant",
      priority: Math.random() > 0.7 ? "High" : "Normal"
    });

    // Event handlers with improved animation timing
    const handleChatHistory = (messages) => {
      if (!messages || messages.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // Add timestamps if they don't exist
      const messagesWithTimestamps = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
      
      setChat(messagesWithTimestamps);
      setIsLoading(false);
      
      // Slight delay to ensure DOM updates before scrolling
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    };

    const handleMessage = (newMessage) => {
      setChat((prevChat) => {
        // Add timestamp if it doesn't exist
        const messageWithTimestamp = {
          ...newMessage,
          timestamp: newMessage.timestamp || new Date().toISOString(),
        };
        return [...prevChat, messageWithTimestamp];
      });
      
      setIsLoading(false);
      setUserThinking(false);
      
      // Wait for state update, then scroll
      requestAnimationFrame(() => {
        if (autoScroll) {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
          // Notify user of new message if not auto-scrolling
          showToast.info("New message received");
        }
      });
    };

    const handleRoomDeleted = ({ roomId: deletedRoomId }) => {
      console.log(`Room ${deletedRoomId} has been deleted`);
      showToast.info(`Case #${deletedRoomId.slice(-8).toUpperCase()} has been closed`);
      
      // Smooth transition before navigating away
      setTimeout(() => navigate("/"), 1000);
    };

    const handleTyping = () => {
      setIsTyping(true);
      // If we were already at the bottom, scroll to see the typing indicator
      if (autoScroll) {
        requestAnimationFrame(() => {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      }
    };

    const handleStopTyping = () => {
      setIsTyping(false);
    };

    const handleError = (error) => {
      console.error("Socket error:", error);
      showToast.error("An error occurred. Please try again.");
      setIsLoading(false);
      setUserThinking(false);
    };

    // Register event listeners
    socket.on("chatHistory", handleChatHistory);
    socket.on("question", handleMessage);
    socket.on("response", handleMessage);
    socket.on("roomDeleted", handleRoomDeleted);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("error", handleError);

    // Clean up event listeners on unmount
    return () => {
      socket.off("chatHistory", handleChatHistory);
      socket.off("question", handleMessage);
      socket.off("response", handleMessage);
      socket.off("roomDeleted", handleRoomDeleted);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("error", handleError);
    };
  }, [roomId, navigate, autoScroll]);

  // Send message with improved validation and loading state
  const sendMessage = (e) => {
    e.preventDefault();
    
    // Check if message or image exists and not already loading
    if ((message.trim() || selectedImage) && !isLoading) {
      // Set thinking status first for better UX
      setUserThinking(true);
      setIsLoading(true);
      
      const role = window.location.pathname.includes("/chat/")
        ? "responder"
        : "asker";
      
      if (selectedImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          socket.emit(role === "responder" ? "response" : "question", {
            roomId,
            msg: message,
            image: reader.result,
            timestamp: new Date().toISOString(),
          });
          
          // Add message to chat immediately for better UX
          setChat(prevChat => [...prevChat, {
            role: role === "responder" ? "responder" : "user",
            message,
            image: reader.result,
            timestamp: new Date().toISOString()
          }]);
        };
        reader.readAsDataURL(selectedImage);
      } else {
        socket.emit(role === "responder" ? "response" : "question", {
          roomId,
          msg: message,
          timestamp: new Date().toISOString(),
        });
        
        // Add message to chat immediately for better UX
        setChat(prevChat => [...prevChat, {
          role: role === "responder" ? "responder" : "user",
          message,
          timestamp: new Date().toISOString()
        }]);
      }

      // Clear message field and attachments
      setMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      socket.emit("stopTyping", { roomId });
      
      // Refocus the input with slight delay for better mobile experience
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 300);
      
      // Scroll to bottom to show the sent message
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  // Debounced typing indicator with cancel
  const debouncedStopTyping = useRef(null);
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { roomId });
    autoResize(e.target);

    // Clear previous timeout
    if (debouncedStopTyping.current) {
      clearTimeout(debouncedStopTyping.current);
    }
    
    // Set new timeout
    debouncedStopTyping.current = setTimeout(() => {
      socket.emit("stopTyping", { roomId });
    }, 1000);
  };

  // Enhanced image handling with validation
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error("Please select a valid image file");
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Image is too large (max 5MB)");
      return;
    }
    
    setSelectedImage(file);
    
    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    showToast.info("Image attached. Send your message when ready.");
    
    // Focus on text input after image upload
    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    // Focus on text input after removing image
    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  // Improved share functionality with fallbacks
  const shareChat = () => {
    const shareData = {
      title: `LegalAI Case #${roomId.slice(-8).toUpperCase()}`,
      text: 'Review this legal consultation',
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => showToast.success("Case shared successfully"))
        .catch(err => {
          console.error("Share error:", err);
          // Fallback to clipboard copy
          copyToClipboard(shareData.url);
        });
    } else {
      copyToClipboard(shareData.url);
    }
  };
  
  // Helper for copying text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast.success("Case link copied to clipboard"))
      .catch(err => showToast.error("Could not copy link"));
  };

  // Create new chat with transition effects
  const createNewChat = () => {
    setIsLoading(true);
    socket.emit("createRoom", (newRoomId) => {
      navigate(`/chat/${newRoomId}`);
      showToast.success("New case created");
    });
  };

  // Auto-resize textarea with height limits
  const autoResize = (textarea) => {
    // Reset height temporarily to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set new height with a max height of 150px
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = `${newHeight}px`;
  };

  // Toggle knowledge panel with animation timing
  const toggleKnowledgePanel = () => {
    setShowKnowledgePanel(!showKnowledgePanel);
  };
  
  // Scroll to bottom button handler
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement === messageInputRef.current) {
          sendMessage(new Event('submit'));
        }
      }
      
      // Esc to close knowledge panel if open
      if (e.key === 'Escape' && showKnowledgePanel) {
        setShowKnowledgePanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message, selectedImage, isLoading, showKnowledgePanel]);

  return (
    <div className="flex flex-col h-screen bg-legal-parchment">
      {/* Header */}
      <header className="bg-legal-navy text-legal-gold py-3 px-4 flex items-center justify-between border-b border-legal-border shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createNewChat}
            className="p-2 rounded-full bg-legal-burgundy text-legal-gold hover:bg-legal-darkburgundy transition-colors"
            title="New Case"
          >
            <BookOpen className="w-5 h-5" />
          </motion.button>
          
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-legal-gold" />
            <h1 className="text-xl font-serif font-semibold text-legal-gold">
              AI Legal Assistant
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleKnowledgePanel}
            className="p-2 rounded-full bg-legal-lightnavy text-white hover:bg-legal-navy transition-colors hidden md:flex"
            title="Legal Library"
          >
            <BookText className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareChat}
            className="p-2 rounded-full bg-legal-burgundy text-legal-gold hover:bg-legal-darkburgundy transition-colors"
            title="Share Case"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
          
          <div className="p-2 rounded-full bg-legal-burgundy">
            <UserCircle className="w-5 h-5 text-legal-gold" />
          </div>
        </div>
      </header>

      {/* Main content with optional knowledge panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Messages */}
        <main 
          ref={chatContainerRef}
          className="flex-1 overflow-auto bg-legal-parchment p-4 lg:p-6 relative"
        >
          {/* Case information banner */}
          {caseInfo && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-3 bg-legal-navy/5 rounded-lg border border-legal-navy/20 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-legal-burgundy" />
                  <h2 className="font-medium">Case #{caseInfo.caseNumber}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-legal-navy/70">Status:</span>
                    <span className={`font-medium ${
                      caseInfo.status === "Active" ? "text-green-600" : "text-legal-burgundy"
                    }`}>
                      {caseInfo.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-legal-navy/70">Created:</span>
                    <span className="font-medium">{caseInfo.created}</span>
                  </div>
                  {caseInfo.priority && (
                    <div className="flex items-center gap-1">
                      <span className="text-legal-navy/70">Priority:</span>
                      <span className={`font-medium ${
                        caseInfo.priority === "High" ? "text-red-600" : "text-blue-600"
                      }`}>
                        {caseInfo.priority}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Welcome message for empty chats */}
          {chat.length === 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-10"
            >
              <Scale className="w-16 h-16 mx-auto mb-4 text-legal-burgundy opacity-80" />
              <h2 className="text-2xl font-serif font-semibold mb-3 text-legal-navy">
                Welcome to AI Legal Assistant
              </h2>
              <p className="max-w-lg mx-auto text-legal-navy/80 mb-6">
                Describe your legal situation to receive AI-generated insights informed by established legal principles and public resources. This service is for informational purposes only and does not constitute legal advice or create an attorney-client relationship.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => messageInputRef.current?.focus()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-legal-burgundy text-legal-gold rounded-lg hover:bg-legal-darkburgundy transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Start Consultation
              </motion.button>
            </motion.div>
          )}

          {/* Loading skeleton */}
          {isLoading && chat.length === 0 && (
            <div className="space-y-6 py-4 animate-pulse">
              {[1, 2].map((_, idx) => (
                <div key={idx} className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-3xl p-4 rounded-xl ${
                    idx % 2 === 0 
                      ? "bg-slate-800/30 border-l-4 border-yellow-500/50" 
                      : "bg-gray-50/50 border-r-4 border-slate-600/50"
                  } w-4/5`}>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Chat messages */}
          <AnimatePresence>
            {chat.map((msg, idx) => (
              <ChatBubble key={idx} message={msg} />
            ))}
          </AnimatePresence>
          
          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-legal-navy/60 pl-4 mb-4"
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Clock className="w-4 h-4" />
              </motion.div>
              <span className="text-sm">LegalAI is analyzing your case...</span>
            </motion.div>
          )}
          
          {/* User thinking indicator */}
          {userThinking && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-end mb-4"
            >
              <div className="px-3 py-1 bg-slate-100 rounded-lg text-sm text-legal-navy/60 flex items-center gap-1">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Clock className="w-3 h-3" />
                </motion.div>
                Processing...
              </div>
            </motion.div>
          )}
          
          {/* Scroll to bottom button - visible when not at bottom */}
          {!autoScroll && chat.length > 4 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-24 right-6 p-2 bg-legal-burgundy text-white rounded-full shadow-lg"
              onClick={scrollToBottom}
              title="Scroll to bottom"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>  
          )}
          
          <div ref={chatEndRef} />
        </main>

        {/* Knowledge Panel - Legal Library */}
        <AnimatePresence>
          {showKnowledgePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "300px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full border-l border-legal-border bg-white overflow-y-auto shadow-md"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-serif font-semibold text-legal-navy flex items-center gap-2">
                    <BookText className="w-5 h-5 text-legal-burgundy" />
                    Legal Library
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleKnowledgePanel}
                    icon={<X className="w-5 h-5" />}
                  />
                </div>
                
                {/* Search bar */}
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-legal-navy/50" />
                  <input
                    type="text"
                    placeholder="Search legal resources..."
                    className="w-full pl-10 pr-3 py-2 border border-legal-border rounded-lg focus:ring-2 focus:ring-legal-burgundy focus:border-legal-burgundy"
                  />
                </div>
                
                {/* Resource categories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-legal-navy/70 mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(mockLegalResources.map(r => r.category))).map((category, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full bg-legal-navy/10 text-legal-navy cursor-pointer hover:bg-legal-navy/20 transition-colors"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Resource list with improved animation */}
                <div>
                  <h4 className="text-sm font-medium text-legal-navy/70 mb-2">Related Resources</h4>
                  <AnimatePresence>
                    <div className="space-y-3">
                      {legalResources.map((resource) => (
                        <motion.div 
                          key={resource.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="p-3 border border-legal-border rounded-lg hover:border-legal-burgundy hover:bg-legal-parchment/50 cursor-pointer transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-legal-navy">{resource.title}</h5>
                              <span className="text-xs text-legal-navy/60 bg-legal-navy/10 px-2 py-0.5 rounded-full">
                                {resource.category}
                              </span>
                              <p className="text-sm mt-2 text-legal-navy/70">{truncateText(resource.preview, 60)}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-legal-navy/50 mt-1" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </div>
                
                {/* Disclaimer */}
                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      The information provided is for educational purposes only and does not constitute legal advice.
                      Consult with a qualified attorney for professional guidance.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <form 
        onSubmit={sendMessage} 
        className="bg-legal-offwhite p-4 border-t border-legal-border shadow-md sticky bottom-0 z-10"
      >
        <div className="max-w-4xl mx-auto relative">
          {/* Image preview with animation */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="mb-2 relative inline-block"
              >
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-16 rounded-md border border-legal-border shadow-sm"
                />
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute -top-2 -right-2 bg-legal-burgundy text-white rounded-full p-1 shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Input Area */}
<div className="flex gap-3 items-end">
  {/* File input button with hover effect */}
  <div className="relative">
    <input
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="hidden"
      ref={fileInputRef}
      aria-label="Attach image"
    />
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={() => fileInputRef.current.click()}
      className="transition-all hover:bg-gray-100 active:scale-95"
      aria-label="Attach file"
    >
      <Paperclip className="w-5 h-5 text-legal-navy" />
    </Button>
  </div>
  
  {/* Text input with improved accessibility */}
  <div className="flex-1 relative">
    <textarea
      ref={messageInputRef}
      value={message}
      onChange={handleInputChange}
      placeholder="Describe your legal issue..."
      className="w-full p-3 rounded-lg bg-white border border-legal-border focus:ring-2 focus:ring-legal-burgundy focus:border-legal-burgundy transition-colors resize-none"
      rows="1"
      disabled={isLoading}
      aria-label="Message input"
    />
    {message.length > 0 && (
      <span className="absolute bottom-2 right-3 text-xs text-legal-navy/40">
        {message.length} characters
      </span>
    )}
  </div>
  
  {/* Send button with visual feedback */}
  <Button
    type="submit"
    variant={message.trim() || selectedImage ? "primary" : "disabled"}
    size="icon"
    className={`transition-all ${(message.trim() || selectedImage) && !isLoading ? 'hover:bg-legal-darkburgundy active:scale-95' : 'opacity-70 cursor-not-allowed'}`}
    disabled={isLoading || (!message.trim() && !selectedImage)}
    aria-label="Send message"
  >
    <Send className="w-5 h-5" />
  </Button>
</div>

{/* Keyboard shortcut hint with visual improvement */}
<div className="mt-2 flex justify-end items-center">
  <div className="text-xs text-legal-navy/50 flex items-center gap-1">
    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md text-xs font-mono">Ctrl</kbd>
    <span>+</span>
    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded-md text-xs font-mono">Enter</kbd>
    <span className="ml-1">to send</span>
  </div>
</div>
        </div>
      </form>
    </div>
  );
};

// Improved Responder Dashboard
const Responder = () => {
  const [activeRooms, setActiveRooms] = useState({});
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statistics, setStatistics] = useState({
    active: 0,
    resolved: 0,
    pending: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("latest");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // Cleaner notification sound player with better error handling
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/soundrn.mp3');
      audio.play()
        .catch(error => console.warn('Sound playback failed:', error));
    } catch (error) {
      console.warn('Could not play notification:', error);
    }
  }, []);

  // Add notification with timestamp and automatic cleanup
  const addNotification = useCallback((message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50
      return updated;
    });
    
    if (!showNotifications) {
      // Visual indicator for new notifications without being intrusive
      showToast.info("New notification received", { duration: 3000 });
    }
  }, [showNotifications]);

  // Format room data for display with more efficient processing
  const formatRoomData = useCallback((roomsList) => {
    const formattedRooms = roomsList.reduce((acc, room) => {
      acc[room.id] = {
        latestMessage: room.latestMessage || "New case opened",
        timestamp: room.timestamp || new Date().toISOString(),
        status: room.status || "active",
        client: room.client || "Anonymous Client",
        priority: room.priority || "normal"
      };
      return acc;
    }, {});
    
    // Update statistics in one pass
    const statCounts = Object.values(formattedRooms).reduce(
      (counts, room) => {
        counts[room.status]++;
        return counts;
      }, 
      { active: 0, resolved: 0, pending: 0, total: Object.keys(formattedRooms).length }
    );
    
    setStatistics(statCounts);
    return formattedRooms;
  }, []);

  // Memoized filtered and sorted rooms for better performance
  const filteredRooms = useMemo(() => {
    const roomEntries = Object.entries(activeRooms);
    
    // Apply filters
    let filtered = roomEntries;
    
    if (filter !== "all") {
      filtered = filtered.filter(([_, room]) => room.status === filter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        ([roomId, room]) => 
          roomId.toLowerCase().includes(query) ||
          room.latestMessage.toLowerCase().includes(query) ||
          room.client.toLowerCase().includes(query)
      );
    }
    
    // Sort rooms
    if (sortBy === "latest") {
      filtered.sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a[1].timestamp) - new Date(b[1].timestamp));
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      filtered.sort((a, b) => priorityOrder[a[1].priority] - priorityOrder[b[1].priority]);
    }
    
    return filtered;
  }, [activeRooms, filter, searchQuery, sortBy]);

  // Initialize socket event listeners with better cleanup
  useEffect(() => {
    setIsLoading(true);
    
    // Request rooms data immediately
    socket.emit("getRooms");
  
    const handleUserJoined = ({ roomId }) => {
      playNotificationSound();
      const caseId = roomId.slice(-8).toUpperCase();
      addNotification(`New client joined case #${caseId}`, 'success');
      showToast.success(`New client in case #${caseId}`);
      
      // Update room list
      socket.emit("getRooms");
    };
  
    const handleRoomsList = (roomsList) => {
      const formattedRooms = formatRoomData(roomsList);
      setActiveRooms(formattedRooms);
      setIsLoading(false);
    };
  
    const handleQuestion = ({ roomId, msg }) => {
      // Update room with new message in one operation
      setActiveRooms(prevActive => ({
        ...prevActive,
        [roomId]: {
          ...prevActive[roomId],
          latestMessage: msg,
          timestamp: new Date().toISOString(),
          status: "active"  // Reset to active if there's a new question
        }
      }));
      
      // Notify user
      const caseId = roomId.slice(-8).toUpperCase();
      playNotificationSound();
      addNotification(`New message in case #${caseId}`, 'info');
    };
  
    const handleRoomDeleted = ({ roomId }) => {
      const caseId = roomId.slice(-8).toUpperCase();
      
      // Remove room in one operation
      setActiveRooms(prevRooms => {
        const newRooms = { ...prevRooms };
        delete newRooms[roomId];
        return newRooms;
      });
      
      addNotification(`Case #${caseId} has been closed`, 'info');
      showToast.success(`Case #${caseId} has been closed`, { duration: 3000 });
    };
  
    // Set up event listeners
    socket.on("userJoined", handleUserJoined);
    socket.on("roomsList", handleRoomsList);
    socket.on("roomDeleted", handleRoomDeleted);
    socket.on("question", handleQuestion);
    socket.on("getRooms", () => socket.emit("getRooms"));
  
    // Clean up all listeners on unmount
    return () => {
      socket.off("userJoined", handleUserJoined);
      socket.off("roomsList", handleRoomsList);
      socket.off("roomDeleted", handleRoomDeleted);
      socket.off("question", handleQuestion);
      socket.off("getRooms");
    };
  }, [addNotification, formatRoomData, playNotificationSound]);
  
  // Handler for room click with navigation
  const handleRoomClick = useCallback((roomId) => {
    navigate(`/chat/${roomId}`);
  }, [navigate]);

  // Room action handlers
  const deleteRoom = useCallback((roomId, e) => {
    if (e) e.stopPropagation();
    socket.emit("deleteRoom", roomId);
  }, []);

  const markRoomResolved = useCallback((roomId, e) => {
    if (e) e.stopPropagation();
    
    setActiveRooms(prevRooms => ({
      ...prevRooms,
      [roomId]: {
        ...prevRooms[roomId],
        status: "resolved"
      }
    }));
    
    showToast.success(`Case #${roomId.slice(-8).toUpperCase()} marked as resolved`, { duration: 3000 });
  }, []);
  
  const togglePriority = useCallback((roomId, e) => {
    if (e) e.stopPropagation();
    
    setActiveRooms(prevRooms => {
      const currentPriority = prevRooms[roomId]?.priority || "normal";
      const nextPriority = {
        low: "normal",
        normal: "high",
        high: "low"
      };
      
      return {
        ...prevRooms,
        [roomId]: {
          ...prevRooms[roomId],
          priority: nextPriority[currentPriority]
        }
      };
    });
  }, []);

  // Memoized badge components for better rendering performance
  const PriorityBadge = memo(({ priority }) => {
    const styles = {
      high: "bg-red-100 text-red-800 border-red-200",
      normal: "bg-blue-100 text-blue-800 border-blue-200",
      low: "bg-green-100 text-green-800 border-green-200"
    };
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  });

  const StatusBadge = memo(({ status }) => {
    const styles = {
      active: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      resolved: "bg-gray-100 text-gray-800 border-gray-200"
    };
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  });

  // Animation variants for smoother transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05 
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-legal-offwhite">
      {/* Dashboard Header - Simplified and Optimized */}
      <header className="bg-legal-navy text-legal-gold p-4 border-b border-legal-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6" />
            <h1 className="text-xl font-serif font-semibold">
              LegalAI Case Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-60 pl-9 pr-3 py-2 rounded-lg bg-legal-navy/70 border border-legal-gold/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-legal-gold/50"
              />
            </div>
            
            <Button
              onClick={() => setShowNotifications(!showNotifications)}
              variant="secondary"
              size="icon"
              className="relative"
              aria-label="Show notifications"
            >
              <MessageSquare className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </Button>
            
            <Button
              onClick={() => navigate("/")}
              variant="primary"
              size="sm"
              aria-label="Switch to client view"
            >
              <UserCircle className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Switch to Client</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Statistics Bar */}
      <div className="bg-legal-parchment border-b border-legal-border py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white p-3 rounded-lg border border-legal-border shadow-sm"
            >
              <div className="text-xs text-legal-navy/70 mb-1">Active Cases</div>
              <div className="text-2xl font-semibold text-legal-navy">{statistics.active}</div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white p-3 rounded-lg border border-legal-border shadow-sm"
            >
              <div className="text-xs text-legal-navy/70 mb-1">Pending</div>
              <div className="text-2xl font-semibold text-legal-navy">{statistics.pending}</div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white p-3 rounded-lg border border-legal-border shadow-sm"
            >
              <div className="text-xs text-legal-navy/70 mb-1">Resolved</div>
              <div className="text-2xl font-semibold text-legal-navy">{statistics.resolved}</div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white p-3 rounded-lg border border-legal-border shadow-sm"
            >
              <div className="text-xs text-legal-navy/70 mb-1">Total Cases</div>
              <div className="text-2xl font-semibold text-legal-navy">{statistics.total}</div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Case List */}
        <main className="flex-1 overflow-auto p-4">
          <div className="max-w-7xl mx-auto">
            {/* Filters and Controls - More Compact and Mobile-Friendly */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {["all", "active", "pending", "resolved"].map((filterType) => (
                  <Button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    variant={filter === filterType ? "primary" : "outline"}
                    size="sm"
                    className="capitalize"
                  >
                    {filterType}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-legal-navy">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="border border-legal-border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-legal-gold/50"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
            </div>
            
            {/* Cases Grid with Animation */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {isLoading ? (
                // Improved loading skeleton
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-legal-border p-4 shadow-legal animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-full">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded mt-4"></div>
                  </div>
                ))
              ) : filteredRooms.length === 0 ? (
                <motion.div 
                  className="col-span-full text-center text-legal-darknavy p-8"
                  variants={itemVariants}
                >
                  <Scale className="w-12 h-12 mx-auto mb-4 text-legal-burgundy" />
                  <p className="text-lg">No cases match your criteria</p>
                  <Button
                    onClick={() => {
                      setFilter("all");
                      setSearchQuery("");
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </motion.div>
              ) : (
                filteredRooms.map(([roomId, roomData]) => (
                  <motion.div
                    key={roomId}
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={`bg-white rounded-xl border ${
                      roomData.priority === "high" ? "border-red-300" : "border-legal-border"
                    } p-4 shadow-legal cursor-pointer transition-all duration-200`}
                    onClick={() => handleRoomClick(roomId)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="w-4 h-4 text-legal-burgundy" />
                          <h3 className="font-semibold text-legal-darknavy">
                            Case #{roomId.slice(-8).toUpperCase()}
                          </h3>
                        </div>
                        
                        <div className="flex gap-2 mb-2">
                          <StatusBadge status={roomData.status} />
                          <PriorityBadge priority={roomData.priority} />
                        </div>
                        
                        <p className="text-sm text-legal-darknavy/80 line-clamp-2 mb-3">
                          {roomData.latestMessage || "New case opened"}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-legal-navy/60">
                            {formatTimestamp(roomData.timestamp)}
                          </div>
                          <div className="text-xs text-legal-navy/70">
                            {roomData.client}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons with tooltips */}
                    <div className="flex justify-between mt-4 pt-3 border-t border-legal-border">
                      <Button
                        onClick={() => handleRoomClick(roomId)}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1 hover:bg-legal-gold/20"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Review
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => togglePriority(roomId, e)}
                          variant="ghost"
                          size="icon"
                          className="group relative"
                          aria-label="Change priority"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-legal-navy text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            Change priority
                          </span>
                        </Button>
                        
                        <Button
                          onClick={(e) => markRoomResolved(roomId, e)}
                          variant="ghost"
                          size="icon"
                          className="group relative"
                          aria-label="Mark as resolved"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-legal-navy text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            Mark as resolved
                          </span>
                        </Button>
                        
                        <Button
                          onClick={(e) => deleteRoom(roomId, e)}
                          variant="ghost"
                          size="icon"
                          className="group relative"
                          aria-label="Close case"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            Close case
                          </span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </main>

        {/* Notifications Panel with Animation */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "350px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full border-l border-legal-border bg-white overflow-y-auto shadow-lg"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-serif font-semibold text-legal-navy">
                    Notifications
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {notifications.length === 0 ? (
                  <div className="text-center p-6 text-legal-navy/60">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <motion.div 
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {notifications.map(notification => (
                      <motion.div 
                        key={notification.id}
                        variants={itemVariants}
                        className={`p-3 border rounded-lg ${
                          notification.type === 'success' 
                            ? 'border-green-200 bg-green-50' 
                            : notification.type === 'error'
                            ? 'border-red-200 bg-red-50'
                            : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <p className={`text-sm ${
                            notification.type === 'success' 
                              ? 'text-green-800' 
                              : notification.type === 'error'
                              ? 'text-red-800'
                              : 'text-blue-800'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </motion.div>
                    ))}
                    
                    {notifications.length > 0 && (
                      <Button
                        onClick={() => setNotifications([])}
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                      >
                        Clear All
                      </Button>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const App = () => {
  const roomId = getRoomIdForUser();

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={`/user/${roomId}`} replace />}
          />
          <Route
            path="/user/:roomId"
            element={<Chat />}
          />
          <Route
            path="/responder"
            element={<Responder />}
          />
          <Route
            path="/chat/:roomId"
            element={<Chat />}
          />
          <Route
            path="*"
            element={<Navigate to={`/user/${roomId}`} replace />}
          />
        </Routes>
      </div>
      <Toaster />
    </Router>
  );
};

const getRoomIdForUser = () => {
  return `room-${Math.random().toString(36).substr(2, 9)}`;
};

export default App;
