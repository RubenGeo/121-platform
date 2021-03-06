import { ApiModelProperty } from '@nestjs/swagger';

import { Length, IsString } from 'class-validator';

export class DidDto {
  @ApiModelProperty({ example: 'did:sov:2wJPyULfLLnYTEFYzByfUR' })
  @Length(29, 30)
  public readonly did: string;
}

export class DidsDto {
  @ApiModelProperty({
    example:
      '[{ "did": "did:sov:6pmP8qazkhbxiUeSUZ7tvi"}, { "did": "did:sov:QdMVfFxgG6ZzqJL4vFiKKC"}]',
  })
  @IsString()
  public readonly dids: string;
}
