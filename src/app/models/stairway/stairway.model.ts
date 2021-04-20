export class Stairway {

  profile!: { picture: string, attributes: { [key: string]: string } };
  plan!: { [key: string]: { [key: string]: { picture: string, attributes: { [key: string]: string } } } };

}
