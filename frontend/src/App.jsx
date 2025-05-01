import { useState, useEffect, useRef } from "react";
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
const socket = io("https://chatgpttroll.onrender.com", {
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
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
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

  // Load legal resources based on chat content
  useEffect(() => {
    if (chat.length > 0) {
      // Simple content-based filtering of legal resources
      const lastMessages = chat.slice(-3).map(msg => msg.message).join(" ");
      const filteredResources = mockLegalResources.filter(resource => 
        lastMessages.toLowerCase().includes(resource.title.toLowerCase()) || 
        lastMessages.toLowerCase().includes(resource.category.toLowerCase())
      );
      
      // Always show some resources
      setLegalResources(
        filteredResources.length > 0 
          ? filteredResources 
          : mockLegalResources.slice(0, 3)
      );
    }
  }, [chat]);

  // Socket.io event handling with improved error handling
  useEffect(() => {
    // Create a clean connection and join room
    socket.emit("joinRoom", roomId);
    socket.emit("getMessages", roomId);
    socket.emit("userJoined", { roomId });
    
    // Fetch mock case info
    setCaseInfo({
      caseNumber: roomId.slice(-8).toUpperCase(),
      status: "Active",
      created: new Date().toLocaleDateString(),
      category: "Legal Consultation",
    });

    // Event handlers
    const handleChatHistory = (messages) => {
      // Add timestamps if they don't exist
      const messagesWithTimestamps = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
      setChat(messagesWithTimestamps);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    const handleMessage = (newMessage) => {
      setChat((prevChat) => {
        // Add timestamp if it doesn't exist
        const messageWithTimestamp = {
          ...newMessage,
          timestamp: newMessage.timestamp || new Date().toISOString(),
        };
        const newChat = [...prevChat, messageWithTimestamp];
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return newChat;
      });
      setIsLoading(false);
    };

    const handleRoomDeleted = ({ roomId: deletedRoomId }) => {
      console.log(`Room ${deletedRoomId} has been deleted`);
      showToast.info(`Case #${deletedRoomId.slice(-8).toUpperCase()} has been closed`);
      navigate("/");
    };

    const handleTyping = () => {
      setIsTyping(true);
    };

    const handleStopTyping = () => {
      setIsTyping(false);
    };

    const handleError = (error) => {
      console.error("Socket error:", error);
      showToast.error("An error occurred. Please try again.");
      setIsLoading(false);
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
  }, [roomId, navigate]);

  // Send message with improved validation and loading state
  const sendMessage = (e) => {
    e.preventDefault();
    
    if ((message.trim() || selectedImage) && !isLoading) {
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
        };
        reader.readAsDataURL(selectedImage);
      } else {
        socket.emit(role === "responder" ? "response" : "question", {
          roomId,
          msg: message,
          timestamp: new Date().toISOString(),
        });
      }

      setMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      socket.emit("stopTyping", { roomId });
      
      // Refocus the input
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  };

  const handleStopTyping = () => {
    socket.emit("stopTyping", { roomId });
  };

  // Debounced typing indicator
  let typingTimeout;
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { roomId });
    autoResize(e.target);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(handleStopTyping, 1000);
  };

  // Enhanced image handling
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      showToast.info("Image attached. Send your message when ready.");
    } else {
      showToast.error("Please select a valid image file");
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    fileInputRef.current.value = "";
  };

  // Improved share functionality
  const shareChat = () => {
    const shareData = {
      title: `LegalAI Case #${roomId.slice(-8).toUpperCase()}`,
      text: 'Review this legal consultation',
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => showToast.success("Case shared successfully"))
        .catch(err => console.error("Share error:", err));
    } else {
      navigator.clipboard.writeText(shareData.url)
        .then(() => showToast.success("Case link copied to clipboard"))
        .catch(err => showToast.error("Could not copy link"));
    }
  };

  // Create new chat
  const createNewChat = () => {
    socket.emit("createRoom", (newRoomId) => {
      navigate(`/chat/${newRoomId}`);
      showToast.success("New case created");
    });
  };

  // Auto-resize textarea
  const autoResize = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  // Toggle knowledge panel
  const toggleKnowledgePanel = () => {
    setShowKnowledgePanel(!showKnowledgePanel);
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message, selectedImage, isLoading]);

  return (
    <div className="flex flex-col h-screen bg-legal-parchment">
      {/* Header */}
      <header className="bg-legal-navy text-legal-gold p-4 flex items-center justify-between border-b border-legal-border">
        <div className="flex items-center gap-4">
          <Button
            onClick={createNewChat}
            variant="primary"
            size="icon"
            icon={<BookOpen className="w-5 h-5" />}
          />
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-legal-gold" />
            <h1 className="text-xl font-serif font-semibold text-legal-gold">
              AI Legal Assistant
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleKnowledgePanel}
            variant="secondary"
            size="sm"
            className="hidden md:flex"
            icon={<BookText className="w-4 h-4" />}
          >
            <span className="hidden lg:inline">Legal Library</span>
          </Button>
          
          <Button
            onClick={shareChat}
            variant="primary"
            size="sm"
            icon={<Share2 className="w-4 h-4" />}
          >
            <span className="hidden md:inline">Share Case</span>
          </Button>
          
          <div className="p-2 rounded-full bg-legal-burgundy">
            <UserCircle className="w-5 h-5 text-legal-gold" />
          </div>
        </div>
      </header>

      {/* Main content with optional knowledge panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Messages */}
        <main className="flex-1 overflow-auto bg-legal-parchment p-4 lg:p-6">
          {/* Case information banner */}
          {caseInfo && (
            <div className="mb-6 p-3 bg-legal-navy/10 rounded-lg border border-legal-navy/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-legal-burgundy" />
                  <h2 className="font-medium">Case #{caseInfo.caseNumber}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-legal-navy/70">Status:</span>
                    <span className="font-medium text-legal-burgundy">{caseInfo.status}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-legal-navy/70">Created:</span>
                    <span className="font-medium">{caseInfo.created}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Welcome message for empty chats */}
          {chat.length === 0 && (
            <div className="text-center py-10">
              <Scale className="w-16 h-16 mx-auto mb-4 text-legal-burgundy opacity-80" />
              <h2 className="text-2xl font-serif font-semibold mb-3 text-legal-navy">
                Welcome to AI Legal Assistant
              </h2>
              <p className="max-w-lg mx-auto text-legal-navy/80 mb-6">
              Describe your legal situation to receive AI-generated insights informed by established legal principles and public resources. This service is for informational purposes only and does not constitute legal advice or create an attorney-client relationship.
              </p>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="md"
                  icon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => messageInputRef.current?.focus()}
                >
                  Start Consultation
                </Button>
              </div>
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
            <div className="flex items-center gap-2 text-legal-navy/60 pl-4 mb-4">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Clock className="w-4 h-4" />
              </motion.div>
              <span className="text-sm">LegalAI is analyzing your case...</span>
            </div>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-legal-navy/60 pl-4 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Scale className="w-4 h-4" />
              </motion.div>
              <span className="text-sm">Processing your request...</span>
            </div>
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
              className="h-full border-l border-legal-border bg-white overflow-y-auto"
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
                        className="text-xs px-2 py-1 rounded-full bg-legal-navy/10 text-legal-navy cursor-pointer hover:bg-legal-navy/20"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Resource list */}
                <div>
                  <h4 className="text-sm font-medium text-legal-navy/70 mb-2">Related Resources</h4>
                  <div className="space-y-3">
                    {legalResources.map((resource) => (
                      <div 
                        key={resource.id}
                        className="p-3 border border-legal-border rounded-lg hover:border-legal-burgundy cursor-pointer transition-colors"
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
                      </div>
                    ))}
                  </div>
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
      <form onSubmit={sendMessage} className="bg-legal-offwhite p-4 border-t border-legal-border">
        <div className="max-w-4xl mx-auto relative">
          {/* Image preview */}
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-16 rounded-md border border-legal-border"
              />
              <button
                type="button"
                onClick={removeSelectedImage}
                className="absolute -top-2 -right-2 bg-legal-burgundy text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            {/* File input button */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => fileInputRef.current.click()}
                icon={<Paperclip className="w-5 h-5" />}
              />
            </div>
            
            {/* Text input */}
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={handleInputChange}
              placeholder="Describe your legal issue..."
              className="flex-1 p-3 rounded-lg bg-white border border-legal-border focus:ring-2 focus:ring-legal-burgundy focus:border-legal-burgundy"
              rows="1"
              disabled={isLoading}
            />
            
            {/* Send button */}
            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={isLoading || (!message.trim() && !selectedImage)}
              icon={<Send className="w-5 h-5" />}
            />
          </div>
          
          {/* Keyboard shortcut hint */}
          <div className="mt-2 text-xs text-legal-navy/50 text-right">
            Press Ctrl+Enter to send
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

  // Audio notification sound with better error handling
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/soundrn.mp3');
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('Notification sound played'))
          .catch(error => console.warn('Sound playback failed:', error));
      }
    } catch (error) {
      console.warn('Could not play notification:', error);
    }
  };

  // Add notification with timestamp
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    
    if (!showNotifications) {
      // Visual indicator that there are new notifications
      showToast.info("New notification received");
    }
  };

  // Format room data for display
  const formatRoomData = (roomsList) => {
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
    
    // Update statistics
    const statCounts = {
      active: 0,
      resolved: 0,
      pending: 0,
      total: Object.keys(formattedRooms).length
    };
    
    Object.values(formattedRooms).forEach(room => {
      if (room.status === "active") statCounts.active++;
      else if (room.status === "resolved") statCounts.resolved++;
      else if (room.status === "pending") statCounts.pending++;
    });
    
    setStatistics(statCounts);
    return formattedRooms;
  };

  // Filter and sort rooms
  const getFilteredRooms = () => {
    const roomEntries = Object.entries(activeRooms);
    
    // Filter by status and search query
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
  };

  // Initialize and socket event listeners
  useEffect(() => {
    setIsLoading(true);
    
    socket.emit("getRooms");
  
    const handleUserJoined = ({ roomId }) => {
      playNotificationSound();
      console.log(`User joined room: ${roomId}`);
      addNotification(`New client joined case #${roomId.slice(-8).toUpperCase()}`, 'success');
      
      showToast.success(`New client in case #${roomId.slice(-8).toUpperCase()}`);
      
      // Update room list
      socket.emit("getRooms");
    };
  
    const handleRoomsList = (roomsList) => {
      console.log("Received rooms list:", roomsList);
      const formattedRooms = formatRoomData(roomsList);
      setActiveRooms(formattedRooms);
      setIsLoading(false);
    };
  
    const handleQuestion = ({ roomId, msg }) => {
      console.log("Received question:", msg);
      
      // Update the active rooms with the new message
      setActiveRooms(prevActive => ({
        ...prevActive,
        [roomId]: {
          ...prevActive[roomId],
          latestMessage: msg,
          timestamp: new Date().toISOString(),
          status: "active"  // Reset to active if there's a new question
        }
      }));
      
      // Play sound and add notification
      playNotificationSound();
      addNotification(`New message in case #${roomId.slice(-8).toUpperCase()}`, 'info');
    };
  
    const handleRoomDeleted = ({ roomId }) => {
      console.log(`Room ${roomId} has been deleted`);
      
      setActiveRooms(prevRooms => {
        const newRooms = { ...prevRooms };
        delete newRooms[roomId];
        return newRooms;
      });
      
      addNotification(`Case #${roomId.slice(-8).toUpperCase()} has been closed`, 'info');
      showToast.success(`Case #${roomId.slice(-8).toUpperCase()} has been closed`);
    };
  
    socket.on("userJoined", handleUserJoined);
    socket.on("roomsList", handleRoomsList);
    socket.on("roomDeleted", handleRoomDeleted);
    socket.on("question", handleQuestion);
    socket.on("getRooms", () => {
      socket.emit("getRooms");
    });
  
    return () => {
      socket.off("userJoined", handleUserJoined);
      socket.off("roomsList", handleRoomsList);
      socket.off("roomDeleted", handleRoomDeleted);
      socket.off("question", handleQuestion);
      socket.off("getRooms");
    };
  }, []);
  
  const handleRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  const sendResponse = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  const deleteRoom = (roomId) => {
    console.log(`Deleting room from client: ${roomId}`);
    socket.emit("deleteRoom", roomId);
  };

  const markRoomResolved = (roomId, e) => {
    e.stopPropagation();
    
    setActiveRooms(prevRooms => ({
      ...prevRooms,
      [roomId]: {
        ...prevRooms[roomId],
        status: "resolved"
      }
    }));
    
    showToast.success(`Case #${roomId.slice(-8).toUpperCase()} marked as resolved`);
  };
  
  const togglePriority = (roomId, e) => {
    e.stopPropagation();
    
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
  };

  // Priority badge component
  const PriorityBadge = ({ priority }) => {
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
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
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
  };

  // Get filtered and sorted rooms
  const filteredRooms = getFilteredRooms();
  
  return (
    <div className="flex flex-col h-screen bg-legal-offwhite">
      {/* Dashboard Header */}
      <header className="bg-legal-navy text-legal-gold p-4 border-b border-legal-border">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6" />
            <h1 className="text-xl font-serif font-semibold">
              LegalAI Case Dashboard
            </h1>
          </div>
          
          {/* Search & Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-60 pl-9 pr-3 py-2 rounded-lg bg-legal-navy/70 border border-legal-gold/30 text-white placeholder-gray-300"
              />
            </div>
            
            <Button
              onClick={() => setShowNotifications(!showNotifications)}
              variant="secondary"
              size="icon"
              className="relative"
              icon={
                <>
                  <MessageSquare className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </>
              }
            />
            
            <Button
              onClick={() => navigate("/")}
              variant="primary"
              size="sm"
              icon={<UserCircle className="w-4 h-4" />}
            >
              <span className="hidden md:inline">Switch to Client</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Statistics Bar */}
      <div className="bg-legal-parchment border-b border-legal-border py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-legal-border shadow-sm">
              <div className="text-xs text-legal-navy/70 mb-1">Active Cases</div>
              <div className="text-2xl font-semibold text-legal-navy">{statistics.active}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-legal-border shadow-sm">
              <div className="text-xs text-legal-navy/70 mb-1">Pending</div>
              <div className="text-2xl font-semibold text-legal-navy">{statistics.pending}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-legal-border shadow-sm">
              <div className="text-xs text-legal-navy/70 mb-1">Resolved</div>
              <div className="text-2xl font-semibold text-legal-navy">{statistics.resolved}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-legal-border shadow-sm">
              <div className="text-xs text-legal-navy/70 mb-1">Total Cases</div>
              <div className="text-2xl font-semibold text-legal-navy">{statistics.total}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Case List */}
        <main className="flex-1 overflow-auto p-4">
          <div className="max-w-7xl mx-auto">
            {/* Filters and Controls */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => setFilter("all")}
                  variant={filter === "all" ? "primary" : "outline"}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  onClick={() => setFilter("active")}
                  variant={filter === "active" ? "primary" : "outline"}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  onClick={() => setFilter("pending")}
                  variant={filter === "pending" ? "primary" : "outline"}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  onClick={() => setFilter("resolved")}
                  variant={filter === "resolved" ? "primary" : "outline"}
                  size="sm"
                >
                  Resolved
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-legal-navy">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="border border-legal-border rounded-md px-2 py-1 bg-white"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
            </div>
            
            {/* Cases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-legal-border p-4 shadow-legal animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="w-full">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredRooms.length === 0 ? (
                <div className="col-span-full text-center text-legal-darknavy p-8">
                  <Scale className="w-12 h-12 mx-auto mb-4 text-legal-burgundy" />
                  <p className="text-lg">No cases match your criteria</p>
                </div>
              ) : (
                filteredRooms.map(([roomId, roomData]) => (
                  <motion.div
                    key={roomId}
                    whileHover={{ y: -2 }}
                    className={`bg-white rounded-xl border ${
                      roomData.priority === "high" ? "border-red-300" : "border-legal-border"
                    } p-4 shadow-legal cursor-pointer`}
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
                    
                    {/* Action buttons */}
                    <div className="flex justify-between mt-4 pt-3 border-t border-legal-border">
                      <Button
                        onClick={(e) => sendResponse(roomId)}
                        variant="secondary"
                        size="sm"
                        icon={<MessageSquare className="w-4 h-4" />}
                      >
                        Review
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => togglePriority(roomId, e)}
                          variant="ghost"
                          size="icon"
                          icon={<FileText className="w-4 h-4" />}
                          title="Change priority"
                        />
                        
                        <Button
                          onClick={(e) => markRoomResolved(roomId, e)}
                          variant="ghost"
                          size="icon"
                          icon={<CheckCircle className="w-4 h-4" />}
                          title="Mark as resolved"
                        />
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRoom(roomId);
                          }}
                          variant="ghost"
                          size="icon"
                          icon={<Trash2 className="w-4 h-4 text-red-500" />}
                          title="Close case"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </main>

        {/* Notifications Panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "350px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full border-l border-legal-border bg-white overflow-y-auto"
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
                    icon={<X className="w-5 h-5" />}
                  />
                </div>
                
                {notifications.length === 0 ? (
                  <div className="text-center p-6 text-legal-navy/60">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id}
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
                      </div>
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
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

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