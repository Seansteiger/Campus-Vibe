'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { feedsApi, postsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    verified: boolean;
  };
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

type FeedType = 'campus' | 'university' | 'province' | 'national';

export default function FeedPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedType, setFeedType] = useState<FeedType>('campus');
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadFeed();
  }, [isAuthenticated, feedType]);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      let response;
      switch (feedType) {
        case 'campus':
          if (user?.campusId) {
            response = await feedsApi.getCampus(user.campusId);
          }
          break;
        case 'university':
          if (user?.universityId) {
            response = await feedsApi.getUniversity(user.universityId);
          }
          break;
        case 'province':
          response = await feedsApi.getProvince('Gauteng'); // TODO: Get from user
          break;
        case 'national':
          response = await feedsApi.getNational();
          break;
      }
      if (response) {
        setPosts(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    setIsPosting(true);
    try {
      const response = await postsApi.create({
        content: newPostContent,
        visibility: feedType === 'national' ? 'NATIONAL' : feedType === 'province' ? 'PROVINCE' : feedType === 'university' ? 'UNIVERSITY' : 'CAMPUS',
      });
      setPosts([response.data, ...posts]);
      setNewPostContent('');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await postsApi.like(postId);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: response.data.liked, 
              likesCount: response.data.liked ? post.likesCount + 1 : post.likesCount - 1 
            } 
          : post
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const response = await postsApi.save(postId);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, isSaved: response.data.saved } 
          : post
      ));
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const feedTabs: { key: FeedType; label: string }[] = [
    { key: 'campus', label: 'Campus' },
    { key: 'university', label: 'University' },
    { key: 'province', label: 'Province' },
    { key: 'national', label: 'National' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <span className="text-xl font-bold text-primary-600">Campus Vibe</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/chat')}
                className="text-gray-600 hover:text-primary-600"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              <button
                onClick={() => router.push(`/profile/${user?.id}`)}
                className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Feed Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex space-x-1">
            {feedTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFeedType(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  feedType === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Create Post */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <form onSubmit={handleCreatePost}>
            <div className="flex space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="What's on your mind?"
                  className="w-full border-0 resize-none focus:ring-0 text-gray-700 placeholder-gray-400"
                  rows={3}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="flex justify-end pt-2 border-t">
                  <button
                    type="submit"
                    disabled={isPosting || !newPostContent.trim()}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPosting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full spinner" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {post.author.avatarUrl ? (
                        <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold">
                          {post.author.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-gray-900">{post.author.displayName}</span>
                        {post.author.verified && (
                          <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{formatRelativeTime(post.createdAt)}</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                  <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Media */}
                {post.media && post.media.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className={`grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {post.media.map((media) => (
                        <div key={media.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                          {media.type === 'IMAGE' ? (
                            <img src={media.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <video src={media.url} className="w-full h-full object-cover" controls />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Actions */}
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{post.likesCount}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-primary-600">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.commentsCount}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">{post.sharesCount}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleSave(post.id)}
                    className={`${post.isSaved ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'}`}
                  >
                    <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
