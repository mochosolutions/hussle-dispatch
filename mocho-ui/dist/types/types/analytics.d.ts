/**
 * Analytics Event
 * Represents a single analytics event with properties and metadata
 */
export interface AnalyticsEvent {
    name: string;
    properties?: Record<string, unknown>;
    timestamp?: Date;
}
/**
 * Analytics Adapter Interface
 * Defines the contract for all analytics platform adapters (PostHog, Segment, etc.)
 */
export interface AnalyticsAdapter {
    /**
     * Track an event
     * @param event - The event to track
     */
    track(event: AnalyticsEvent): void | Promise<void>;
    /**
     * Identify a user
     * @param userId - The user ID
     * @param traits - Optional user traits/properties
     */
    identify(userId: string, traits?: Record<string, unknown>): void | Promise<void>;
    /**
     * Track a page view
     * @param pageName - The name of the page
     * @param properties - Optional page properties
     */
    page(pageName: string, properties?: Record<string, unknown>): void | Promise<void>;
}
/**
 * Predefined CRUD Page Events
 * Type-safe event names tracked by CRUD components
 */
export declare enum CrudPageEvent {
    LIST_VIEW = "CrudListPage.View",
    LIST_CREATE_CLICK = "CrudListPage.CreateClick",
    LIST_ERROR = "CrudListPage.Error",
    FORM_VIEW = "CrudFormPage.View",
    FORM_SUBMIT_CLICK = "CrudFormPage.SubmitClick",
    FORM_SUBMIT_SUCCESS = "CrudFormPage.SubmitSuccess",
    FORM_SUBMIT_ERROR = "CrudFormPage.SubmitError",
    FORM_CANCEL_CLICK = "CrudFormPage.CancelClick",
    FORM_DIRTY_STATE_CHANGE = "CrudFormPage.DirtyStateChange"
}
/**
 * Event Properties Interfaces
 * Type-safe property definitions for CRUD events
 */
export interface ListViewEventProperties {
    entityName: string;
    title: string;
}
export interface ListCreateClickEventProperties {
    entityName: string;
}
export interface ListErrorEventProperties {
    entityName: string;
    errorMessage: string;
    errorType?: string;
}
export interface FormViewEventProperties {
    entityName: string;
    mode: 'create' | 'edit';
}
export interface FormSubmitEventProperties {
    entityName: string;
    mode: 'create' | 'edit';
}
export interface FormSubmitSuccessEventProperties extends FormSubmitEventProperties {
    duration: number;
}
export interface FormSubmitErrorEventProperties extends FormSubmitEventProperties {
    errorMessage: string;
    errorType?: string;
}
export interface FormCancelClickEventProperties {
    entityName: string;
    isDirty: boolean;
}
export interface FormDirtyStateChangeEventProperties {
    entityName: string;
    isDirty: boolean;
}
//# sourceMappingURL=analytics.d.ts.map