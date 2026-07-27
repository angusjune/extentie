import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { resolveIconColor, resolveIconPath, iconColors, iconPaths } from '@/action-icon'

describe('resolveIconColor', () => {
    test('follows the browser theme on auto', () => {
        assert.equal(resolveIconColor('auto', 'dark'), iconColors.LIGHT)
        assert.equal(resolveIconColor('auto', 'light'), iconColors.DARK)
    })

    test('uses the colour the user picked', () => {
        assert.equal(resolveIconColor('blue', 'light'), iconColors.BLUE)
        assert.equal(resolveIconColor('yellow', 'dark'), iconColors.YELLOW)
        assert.equal(resolveIconColor('light', 'light'), iconColors.LIGHT)
    })

    // A storage change can wake the worker before it has read the options.
    test('falls back to the theme when the options have not loaded', () => {
        assert.equal(resolveIconColor(undefined, 'dark'), iconColors.LIGHT)
        assert.equal(resolveIconColor(undefined, 'light'), iconColors.DARK)
    })

    test('falls back when the colour scheme has not loaded either', () => {
        assert.equal(resolveIconColor(undefined, undefined), iconColors.DARK)
    })

    test('falls back for a colour it does not know', () => {
        assert.equal(resolveIconColor('chartreuse', 'light'), iconColors.DARK)
    })

    test('never returns nothing to paint with', () => {
        for (const color of [undefined, null, '', 'auto', 'nope', 42, {}]) {
            for (const scheme of [undefined, 'light', 'dark']) {
                assert.ok(Object.values(iconColors).includes(resolveIconColor(color, scheme)),
                    `resolveIconColor(${JSON.stringify(color)}, ${scheme}) gave something unpaintable`)
            }
        }
    })
})

describe('resolveIconPath', () => {
    test('returns the outline for each style', () => {
        assert.equal(resolveIconPath('classic'), iconPaths.CLASSIC)
        assert.equal(resolveIconPath('modern'), iconPaths.MODERN)
        assert.equal(resolveIconPath('geometric'), iconPaths.GEOMETRIC)
    })

    test('falls back for a style it does not know or has not loaded', () => {
        for (const style of [undefined, null, '', 'squiggly', 7]) {
            assert.equal(resolveIconPath(style), iconPaths.CLASSIC, `for ${JSON.stringify(style)}`)
        }
    })
})
