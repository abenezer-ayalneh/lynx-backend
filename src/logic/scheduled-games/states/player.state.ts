import { Schema, type } from '@colyseus/schema'

export default class Player extends Schema {
  @type('string') id: string

  @type('string') name: string

  constructor(id: string, name: string) {
    super()

    this.id = id
    this.name = name
  }
}
