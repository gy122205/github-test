/**
 * 商品评论列表组件，支持动态高度虚拟滚动、图片优化、本地缓存等功能
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import localforage from 'localforage';
import './CommentList.css';

/**
 * 存储评论到 localforage
 * @param comments 评论数组
 * @param page 当前页码
 * @param hasMore 是否还有更多
 */
async function saveCommentsToDB(comments: any[], page: number, hasMore: boolean) {
  await localforage.setItem('comment_list_cache', { comments, page, hasMore });
}

/**
 * 从 localforage 读取评论缓存
 */
async function getCommentsFromDB() {
  return (await localforage.getItem('comment_list_cache')) as { comments: any[]; page: number; hasMore: boolean } | null;
}

/**
 * 模拟后端数据请求，生成评论数据
 * @param page 当前页码
 * @param pageSize 每页数量
 */
const fetchComments = (page: number, pageSize: number) => {
  return new Promise<{
    id: number;
    username: string;
    content: string;
    images: string[];
  }[]>((resolve) => {
    setTimeout(() => {
      // 生成模拟评论数据
      const comments = Array.from({ length: pageSize }, (_, i) => {
        const id = page * pageSize + i + 1;
        // 随机决定是否有图片
        const hasImages = Math.random() > 0.5;
        return {
          id,
          username: `用户${id}`,
          content: `这是第${id}条评论，内容很精彩！`,
          images: hasImages
            ? [
                `https://picsum.photos/seed/${id}a/80/80.webp`,
                `https://picsum.photos/seed/${id}b/80/80.webp`,
              ].slice(0, Math.random() > 0.5 ? 2 : 1)
            : [],
        };
      });
      resolve(comments);
    }, 800); // 模拟网络延迟
  });
};

/** 每页评论数量 */
const PAGE_SIZE = 20;

/**
 * 商品评论列表主组件
 */
const CommentList: React.FC = () => {
  /** 评论数据 */
  const [comments, setComments] = useState<any[]>([]);
  /** 当前页码 */
  const [page, setPage] = useState(0);
  /** 加载中状态 */
  const [loading, setLoading] = useState(false);
  /** 是否还有更多 */
  const [hasMore, setHasMore] = useState(true);
  /** 横向/纵向滚动切换 */
  const [isHorizontal, setIsHorizontal] = useState(false);

  /**
   * 加载更多评论
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const newComments = await fetchComments(page, PAGE_SIZE);
    setComments((prev) => {
      const updated = [...prev, ...newComments];
      saveCommentsToDB(updated, page + 1, newComments.length >= PAGE_SIZE);
      return updated;
    });
    setPage((prev) => prev + 1);
    if (newComments.length < PAGE_SIZE) setHasMore(false);
    setLoading(false);
  }, [loading, hasMore, page]);

  /**
   * 初始化时尝试读取 localforage 缓存
   */
  useEffect(() => {
    (async () => {
      const cache = await getCommentsFromDB();
      if (cache) {
        setComments(cache.comments || []);
        setPage(cache.page || 0);
        setHasMore(typeof cache.hasMore === 'boolean' ? cache.hasMore : true);
      } else {
        loadMore();
      }
    })();
    // eslint-disable-next-line
  }, []);

  /**
   * 渲染单条评论（支持骨架屏）
   * @param index 评论索引
   */
  const renderComment = (index: number) => {
    const comment = comments[index];
    if (!comment) {
      // 骨架屏
      return (
        <div className="comment-item" style={{ background: '#f3f3f3', borderRadius: 8, boxShadow: '0 1px 4px #eee', padding: 12, margin: '8px 0' }}>
          <div style={{ width: 60, height: 20, background: '#e0e0e0', borderRadius: 4, marginBottom: 10 }} />
          <div style={{ width: '80%', height: 16, background: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 60, height: 60, background: '#e0e0e0', borderRadius: 6 }} />
            <div style={{ width: 60, height: 60, background: '#e0e0e0', borderRadius: 6 }} />
          </div>
        </div>
      );
    }
    return (
      <div className="comment-item" style={{ background: '#fafbfc', borderRadius: 8, boxShadow: '0 1px 4px #eee', padding: 12, margin: '8px 0' }}>
        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>{comment.username}</div>
        <div style={{ marginBottom: 8 }}>{comment.content}</div>
        {comment.images && comment.images.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {comment.images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                alt="评论图片"
                style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover' }}
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* 切换横向/纵向滚动按钮 */}
      <button
        onClick={() => setIsHorizontal((prev) => !prev)}
        style={{ marginBottom: 16 }}
      >
        切换为{isHorizontal ? '纵向' : '横向'}滚动
      </button>
      <div
        className="comment-list-virtual"
        style={{ height: 400, width: 500, border: '1px solid #eee', overflow: 'auto' }}
      >
        {/* 动态高度虚拟滚动列表 */}
        <Virtuoso
          style={{ height: 400, width: 500 }}
          totalCount={comments.length}
          itemContent={renderComment}
          endReached={loadMore}
          components={{
            Footer: () => (
              <>
                {loading && <div style={{ textAlign: 'center', color: '#888', margin: 8 }}>加载中...</div>}
                {!hasMore && <div style={{ textAlign: 'center', color: '#aaa', margin: 8 }}>没有更多评论了</div>}
              </>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default CommentList; 