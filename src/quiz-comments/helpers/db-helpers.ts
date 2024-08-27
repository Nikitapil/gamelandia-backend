export const commentInclude = {
  user: {
    select: {
      username: true
    }
  },
  _count: {
    select: {
      replies: true
    }
  }
} as const;
