// Tests for API calls and utility functions
import { safeJsonParse, handleApiError } from '../utils/shared-functions';

describe('API Integration Tests', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    test('LinkedIn API call handles successful response', async () => {
        const mockResponse = {
            output: {
                answer: '```json\n{"comments":[{"text":"Great post!","type":"Positive"}]}\n```'
            }
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(JSON.stringify(mockResponse))
        });

        const result = await fetchCommentSuggestions('Test post');
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('text', 'Great post!');
        expect(result[0]).toHaveProperty('tone', 'Positive');
    });

    test('Breakcold API call handles successful response', async () => {
        const mockResponse = {
            output: {
                answer: '```json\n{"comments":["Interesting perspective!"]}\n```'
            }
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        const result = await fetchCommentSuggestions('Test post');
        expect(result).toHaveLength(1);
        expect(result[0]).toBe('Interesting perspective!');
    });

    test('API calls handle network errors with retry', async () => {
        global.fetch
            .mockRejectedValueOnce(new Error('Network error'))
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve('{"output":{"answer":"```json\n{"comments":[]}\n```"}}')
            });

        const result = await fetchCommentSuggestions('Test post');
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(result).toEqual([]);
    });
});

describe('Utility Function Tests', () => {
    test('safeJsonParse handles valid JSON', () => {
        const jsonString = '{"key":"value"}';
        const result = safeJsonParse(jsonString, 'test');
        expect(result).toEqual({ key: 'value' });
    });

    test('safeJsonParse handles invalid JSON', () => {
        const invalidJson = '{invalid:json}';
        expect(() => safeJsonParse(invalidJson, 'test')).toThrow('Failed to parse JSON test');
    });

    test('handleApiError implements exponential backoff', async () => {
        const startTime = Date.now();
        await handleApiError(new Error('Test error'), 1, 3);
        const duration = Date.now() - startTime;
        expect(duration).toBeGreaterThanOrEqual(1000); // First retry should wait at least 1 second
    });

    test('handleApiError throws on max retries', async () => {
        await expect(handleApiError(new Error('Test error'), 3, 3))
            .rejects
            .toThrow('Failed after 3 attempts');
    });
});
