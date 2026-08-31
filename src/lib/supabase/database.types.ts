/**
 * Supabase Database Schema Types for Eside (M2 - Milestone 2)
 * Strictly typed definitions matching docs/Database,.md and supabase/migrations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ExperienceStatus = 'active' | 'hidden' | 'reported' | 'deleted';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'misinformation'
  | 'threats'
  | 'privacy_violation'
  | 'other';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type OutcomeDays = 30 | 90 | 180;

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      experiences: {
        Row: {
          id: string;
          author_id: string;
          category_id: string;
          title: string;
          story: string;
          is_anonymous: boolean;
          status: ExperienceStatus;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          category_id: string;
          title: string;
          story: string;
          is_anonymous?: boolean;
          status?: ExperienceStatus;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string;
          category_id?: string;
          title?: string;
          story?: string;
          is_anonymous?: boolean;
          status?: ExperienceStatus;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'experiences_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'experiences_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      experience_tags: {
        Row: {
          experience_id: string;
          tag_id: string;
        };
        Insert: {
          experience_id: string;
          tag_id: string;
        };
        Update: {
          experience_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'experience_tags_experience_id_fkey';
            columns: ['experience_id'];
            referencedRelation: 'experiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'experience_tags_tag_id_fkey';
            columns: ['tag_id'];
            referencedRelation: 'tags';
            referencedColumns: ['id'];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          experience_id: string;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          experience_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          experience_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_experience_id_fkey';
            columns: ['experience_id'];
            referencedRelation: 'experiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      outcomes: {
        Row: {
          id: string;
          experience_id: string;
          days_after: OutcomeDays;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          experience_id: string;
          days_after: OutcomeDays;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          experience_id?: string;
          days_after?: OutcomeDays;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'outcomes_experience_id_fkey';
            columns: ['experience_id'];
            referencedRelation: 'experiences';
            referencedColumns: ['id'];
          }
        ];
      };
      bookmarks: {
        Row: {
          user_id: string;
          experience_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          experience_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          experience_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookmarks_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookmarks_experience_id_fkey';
            columns: ['experience_id'];
            referencedRelation: 'experiences';
            referencedColumns: ['id'];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          experience_id: string | null;
          comment_id: string | null;
          reason: ReportReason;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id?: string | null;
          experience_id?: string | null;
          comment_id?: string | null;
          reason: ReportReason;
          status?: ReportStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string | null;
          experience_id?: string | null;
          comment_id?: string | null;
          reason?: ReportReason;
          status?: ReportStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_experience_id_fkey';
            columns: ['experience_id'];
            referencedRelation: 'experiences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_comment_id_fkey';
            columns: ['comment_id'];
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          }
        ];
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          event_name: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          event_name: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          event_name?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
